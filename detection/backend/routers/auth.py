from fastapi import APIRouter, HTTPException, status, Depends, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from db import get_db, User, create_user, authenticate_user, LoginActivity
import joblib
import pandas as pd
import ipaddress
from datetime import datetime, timedelta
import os
from user_agents import parse
from pathlib import Path
import requests
from sqlalchemy import func, and_
import numpy as np

router = APIRouter(prefix="/auth", tags=["auth"])

def get_ip_info(ip_address: str) -> dict:
    """Looks up Country and ASN for a given IP address using an external API."""
    # Do not look up private IP addresses.
    if ipaddress.ip_address(ip_address).is_private:
        return {"country": "Private", "asn": 0}
    try:
        response = requests.get(f"http://ip-api.com/json/{ip_address}")
        response.raise_for_status()
        data = response.json()
        
        asn_str = data.get("as", "AS0").split(" ")[0]
        asn = int(asn_str[2:]) if asn_str.startswith("AS") else 0

        return {
            "country": data.get("country", "Unknown"),
            "asn": asn,
        }
    except (requests.exceptions.RequestException, ValueError) as e:
        print(f"Could not get IP info for {ip_address}: {e}")
        return {"country": "Unknown", "asn": 0}


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    user_agent: str | None = None # Added to receive data from frontend

# Load the anomaly detection model at module level
# Construct an absolute path to the model file using pathlib for robustness
SCRIPT_DIR = Path(__file__).parent.resolve()
MODEL_PATH = SCRIPT_DIR.parent / "model" / "login_anomaly_pipeline.pkl"
anomaly_pipeline = joblib.load(MODEL_PATH)


@router.post("/signup")
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    user = create_user(db, data.name, data.email, data.password)
    if not user:
        raise HTTPException(status_code=400, detail="User already exists")
    return {"message": "User created successfully"}

@router.post("/login")
def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    # --- 1. Permanent Block Check ---
    # First, check if the user account exists and if it is permanently blocked.
    user_account = db.query(User).filter(User.email == data.email).first()
    if user_account and user_account.is_blocked:
        raise HTTPException(
            status_code=403, # Forbidden
            detail="This account is permanently blocked due to suspicious activity.",
        )

    # --- 2. Brute-Force and Lockout Logic ---
    five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
    recent_failed_attempts = (
        db.query(LoginActivity)
        .filter(
            LoginActivity.email == data.email,
            LoginActivity.login_successful == False,
            LoginActivity.timestamp >= five_minutes_ago,
        )
        .order_by(LoginActivity.timestamp.desc())
        .all()
    )

    # Check if user should be in a temporary lockout period
    if len(recent_failed_attempts) == 3:
        last_attempt_time = recent_failed_attempts[0].timestamp
        if datetime.utcnow() < last_attempt_time + timedelta(seconds=30):
            raise HTTPException(
                status_code=429, # Too Many Requests
                detail="Too many failed login attempts. Please try again in 30 seconds.",
            )

    # --- 3. Feature Extraction (Done for all outcomes) ---
    ip_address = request.client.host if request.client else "127.0.0.1"
    ip_info = get_ip_info(ip_address)
    country = ip_info["country"]
    asn = ip_info["asn"]
    user_agent_string = data.user_agent or "Unknown"
    user_agent_parsed = parse(user_agent_string)
    browser = user_agent_parsed.browser.family
    os_name = user_agent_parsed.os.family
    device_type = "Mobile" if user_agent_parsed.is_mobile else "Desktop" if user_agent_parsed.is_pc else "Tablet" if user_agent_parsed.is_tablet else "Unknown"
    login_time = datetime.now()
    login_hour = login_time.hour

    # --- 4. Authentication ---
    user = authenticate_user(db, data.email, data.password)

    # --- 5. Handle Login Outcome ---
    if not user:
        # This is a FAILED login attempt.

        # Check if this failure should trigger a permanent block.
        if len(recent_failed_attempts) >= 3:
            # The user has already failed 3 times and their temp lock has expired. This is their final chance.
            if user_account:
                user_account.is_blocked = True
                db.add(user_account)
                # Intentionally not logging this failed attempt to avoid confusion, just block.
                db.commit() 
            raise HTTPException(
                status_code=403,
                detail="This account has been permanently blocked due to too many failed login attempts.",
            )
        
        # Log the normal failed attempt (attempts 1, 2, 3)
        failed_login = LoginActivity(
            email=data.email, timestamp=login_time, ip_address=ip_address, country=country,
            asn=asn, user_agent=user_agent_string, device_type=device_type, browser=browser,
            operating_system=os_name, login_successful=False, status="failed", is_anomaly=True,
            anomaly_reason="Invalid credentials", severity="High",
        )
        db.add(failed_login)
        db.commit()
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # --- 6. Handle Successful Login ---
    # If login is successful, clear past failures to reset the counter.
    if recent_failed_attempts:
        for attempt in recent_failed_attempts:
            db.delete(attempt)
    db.commit() # Commit the deletion of failed attempts

    # --- 6. Anomaly Detection for Successful Login ---
    # First, gather historical data and determine behavioral flags.
    behavioral_reasons = []
    is_new_browser_for_user = False
    is_new_country_for_user = False
    
    user_history = (
        db.query(LoginActivity)
        .filter(LoginActivity.user_id == user.id, LoginActivity.login_successful == True)
        .all()
    )

    # We need a reasonable amount of history to make behavioral judgments.
    if len(user_history) > 3:
        # Check for new browser
        known_browsers = {h.browser for h in user_history}
        if browser not in known_browsers:
            is_new_browser_for_user = True
            behavioral_reasons.append("Login from a new browser for this user.")

        # Check for new Operating System
        known_os = {h.operating_system for h in user_history}
        if os_name not in known_os:
            behavioral_reasons.append("Login from a new Operating System for this user.")

        # Check for new country (used as a proxy for new IP region)
        known_countries = {h.country for h in user_history}
        if country not in known_countries and country not in ["Private", "Unknown"]:
            is_new_country_for_user = True
            behavioral_reasons.append("Login from a new country for this user.")

        # Standalone check for unusual time, as it's a statistical measure
        known_hours = [h.timestamp.hour for h in user_history]
        hour_mean = np.mean(known_hours)
        if abs(login_hour - np.mean(known_hours)) > 2 * np.std(known_hours):
            behavioral_reasons.append("Login at an unusual time for this user.")

    # Now, prepare the features with the correct behavioral flags for the model.
    features = pd.DataFrame([{
        "IP Address (as integer)": int(ipaddress.ip_address(ip_address)),
        "login_frequency": 1,  # This might be a placeholder from training
        "is_new_ip": is_new_country_for_user,
        "is_new_browser": is_new_browser_for_user,
        "ASN": asn,
        "Login Hour": login_hour,
        "User Agent String": user_agent_string,
        "Browser Name and Version": browser,
        "OS Name and Version": os_name,
        "Country": country,
        "Device Type": device_type
    }])
    
    anomaly_pred = anomaly_pipeline.predict(features)[0]
    anomaly_score = float(anomaly_pipeline.decision_function(features)[0])

    # The model's prediction is the primary source of the anomaly flag.
    is_anomaly_ml = bool(anomaly_pred == -1)

    # --- Override Logic ---
    # Since the provided model is not sensitive, we empower our own rules.
    # If our rules detect a major change, we will treat it as if the ML model caught it.
    for reason in behavioral_reasons:
        if "new browser" in reason or "new country" in reason or "new Operating System" in reason:
            is_anomaly_ml = True
            break
            
    is_anomaly = is_anomaly_ml or bool(behavioral_reasons)

    # If an anomaly is detected for any reason, ensure the score is negative for consistency.
    if is_anomaly and anomaly_score > 0:
        anomaly_score = -anomaly_score

    # -- Build the detailed, itemized anomaly reason string --
    final_reason_list = []
    if is_anomaly_ml:
        final_reason_list.append("Overall pattern flagged by ML model")
    
    # The 'behavioral_reasons' list already contains our specific, human-readable reasons
    final_reason_list.extend(behavioral_reasons)

    if final_reason_list:
        anomaly_reason = "Suspicious Login Reasons: " + " | ".join(final_reason_list)
        severity = "High" if "country" in anomaly_reason or "browser" in anomaly_reason else "Medium"
        message = f"Suspicious Login Detected! (Reason: {anomaly_reason})"
    else:
        anomaly_reason = "Normal login"
        severity = "Low"
        message = "Login successful"
    
    # --- 7. Log Anomaly Details to Console for Testing ---
    print("\n--- ANOMALY DETECTION LOG ---")
    print(f"User: {user.email}")
    print(f"Is Anomaly: {is_anomaly}")
    print(f"ML Model Anomaly: {is_anomaly_ml}")
    print(f"Behavioral Anomaly: {bool(behavioral_reasons)}")
    print(f"Anomaly Score: {anomaly_score:.4f}")
    print(f"Anomaly Reason: {anomaly_reason}")
    print(f"Severity: {severity}")
    print("-----------------------------\n")

    # Determine the final status for the database log based on the anomaly check.
    # If an anomaly was detected, the login is blocked and therefore is not successful.
    final_login_successful = not is_anomaly
    final_status = "success" if final_login_successful else "failed"

    successful_login = LoginActivity(
        user_id=user.id, email=user.email, timestamp=login_time, ip_address=ip_address, country=country,
        asn=asn, user_agent=user_agent_string, device_type=device_type, browser=browser,
        operating_system=os_name, login_frequency=1, login_successful=final_login_successful, status=final_status,
        is_anomaly=is_anomaly, anomaly_score=anomaly_score, anomaly_reason=anomaly_reason, severity=severity,
    )
    db.add(successful_login)
    db.commit()

    # If an anomaly was detected, deny the login and return the details
    if is_anomaly:
        return {"anomaly_detected": True, "message": message}

    # Otherwise, the login is successful and not an anomaly.
    return {
        "anomaly_detected": False,
        "message": "Login successful",
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
    }

@router.get("/alerts/suspicious-logins")
def get_suspicious_logins(db: Session = Depends(get_db)):
    """
    This endpoint retrieves all login activities that have been flagged as anomalous
    within the last 5 minutes. It is used by the SOC chatbot to report on recent 
    security events.
    """
    # Define the time window for "real-time" alerts
    five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)

    suspicious_logins = (
        db.query(LoginActivity)
        .filter(
            LoginActivity.is_anomaly == True,
            LoginActivity.timestamp >= five_minutes_ago
        )
        .order_by(LoginActivity.timestamp.desc())
        .all()
    )
    
    if not suspicious_logins:
        return []

    # Format the data for the chatbot
    response_data = [{
        "email": login.email,
        "timestamp": login.timestamp.isoformat(),
        "ip_address": login.ip_address,
        "country": login.country,
        "reason": login.anomaly_reason,
        "risk_level": login.severity
    } for login in suspicious_logins]
    
    return response_data
