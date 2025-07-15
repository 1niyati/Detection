import pandas as pd
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, APIRouter, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import joblib
import user_agents
from datetime import datetime
import os
import requests

from db import User, LoginActivity, get_db, pwd_context

# --- Pydantic Models ---
class UserLogin(BaseModel):
    email: str
    password: str
    user_agent: str | None = None # Added to receive from frontend

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

# --- Router and Model Loading ---
router = APIRouter()

try:
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_path = os.path.join(base_dir, "model", "login_anomaly_model.pkl")
    pipeline = joblib.load(model_path)
    print(f"Advanced anomaly detection pipeline loaded successfully from {model_path}.")
except FileNotFoundError:
    print(f"Model file not found at path: {model_path}. Anomaly detection will be disabled.")
    pipeline = None
except Exception as e:
    print(f"An error occurred loading the model: {e}")
    pipeline = None

def get_ip_info(ip_address: str):
    """Fetches geolocation and ASN info for an IP address."""
    if ip_address == "127.0.0.1" or ip_address == "localhost":
        return {"country": "Local", "asn": 0}
    try:
        response = requests.get(f"https://ipapi.co/{ip_address}/json/", timeout=5)
        response.raise_for_status()
        data = response.json()
        return {
            "country": data.get("country_name", "Unknown"),
            "asn": int(data.get("asn", "AS0").replace("AS", "") or 0)
        }
    except requests.RequestException as e:
        print(f"Could not get IP info for {ip_address}: {e}")
        return {"country": "Error", "asn": 0}

# --- Database Utility Functions ---
def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_login_activity(db: Session, user_id: int, email: str, ip_address: str, user_agent: str, successful: bool, anomaly_detected: bool, risk_level: str, details: dict):
    login_activity = LoginActivity(
        user_id=user_id,
        email=email,
        timestamp=datetime.now(),
        ip_address=ip_address,
        user_agent=user_agent,
        login_successful=successful,
        is_anomaly=anomaly_detected,
        severity=risk_level,
        status=details.get("status"),
        login_frequency=details.get("login_frequency"),
        country=details.get("country"),
        asn=details.get("asn"),
        device_type=details.get("device_type"),
        browser=details.get("browser"),
        operating_system=details.get("operating_system"),
        anomaly_score=details.get("anomaly_score"),
        anomaly_reason=details.get("anomaly_reason")
    )
    db.add(login_activity)
    db.commit()
    db.refresh(login_activity)
    return login_activity

def get_user_login_history(db: Session, user_id: int):
    return db.query(LoginActivity).filter(LoginActivity.user_id == user_id).order_by(LoginActivity.timestamp.asc()).all()

# --- Advanced Feature Engineering ---
def create_features_for_live_login(user_agent_from_body: str | None, db: Session, user: User, request: Request, login_frequency: int):
    # Prioritize user agent from body, fall back to header
    user_agent_str = user_agent_from_body or request.headers.get("user-agent", "unknown")
    
    ua = user_agents.parse(user_agent_str)
    ip_address = request.client.host if request.client else "127.0.0.1"
    now = datetime.now()
    login_hour = now.hour
    
    try:
        ip_address_int = sum([int(part) << (8 * i) for i, part in enumerate(reversed(ip_address.split('.')))])
    except (ValueError, AttributeError):
        ip_address_int = 0
    browser = ua.browser.family
    device_type = "Desktop" if ua.is_pc else "Mobile" if ua.is_mobile else "Tablet" if ua.is_tablet else "Other"
    operating_system = ua.os.family

    # Get history for browser/ip check, but use passed-in login_frequency
    history = get_user_login_history(db, user.id)
    seen_ips = {item.ip_address for item in history}
    is_new_ip = 1 if ip_address not in seen_ips else 0

    seen_browsers = {user_agents.parse(item.user_agent).browser.family for item in history}
    is_new_browser = 1 if browser not in seen_browsers else 0
    
    # Add back all the features your current model expects
    day_of_week = now.weekday()
    is_weekend = 1 if day_of_week >= 5 else 0
    # Also include the unusual hour feature
    is_unusual_hour = 1 if login_hour < 9 or login_hour >= 18 else 0

    feature_data = {
        'browser': [browser], 'device_type': [device_type], 'operating_system': [operating_system],
        'login_hour': [login_hour], 'ip_address_int': [ip_address_int], 'login_frequency': [login_frequency],
        'is_new_ip': [is_new_ip], 'is_new_browser': [is_new_browser],
        'day_of_week': [day_of_week], 'is_weekend': [is_weekend],
        'is_unusual_hour': is_unusual_hour
    }
    return pd.DataFrame(feature_data)

# --- Anomaly Prediction ---
def get_model_prediction(model_pipeline, features_df: pd.DataFrame):
    """Just gets the raw prediction and score from the ML model."""
    try:
        X_transformed = model_pipeline.named_steps['preprocessor'].transform(features_df)
        anomaly_score = model_pipeline.named_steps['model'].decision_function(X_transformed)[0]
        is_anomaly = model_pipeline.predict(features_df)[0] == -1
        return bool(is_anomaly), float(anomaly_score), None
    except Exception as e:
        error_message = f"Model Prediction Error: {e}"
        print(error_message)
        return False, 0.0, error_message

# --- API Endpoints ---
@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(user_create: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, email=user_create.email)
    if db_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    hashed_password = pwd_context.hash(user_create.password)
    new_user = User(name=user_create.name, email=user_create.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully", "user_id": new_user.id}

@router.post("/login")
def login(user_login: UserLogin, request: Request, db: Session = Depends(get_db)):
    try:
        user = get_user_by_email(db, user_login.email)

        # Get login history and frequency once
        login_history = get_user_login_history(db, user.id) if user else []
        login_frequency = len(login_history)

        # Gather details early
        user_agent_str = user_login.user_agent or request.headers.get("user-agent", "unknown")
        ua = user_agents.parse(user_agent_str)
        ip_address = request.client.host if request.client else "127.0.0.1"
        ip_info = get_ip_info(ip_address)
        
        details = {
            "country": ip_info.get("country"),
            "asn": ip_info.get("asn"),
            "device_type": "Desktop" if ua.is_pc else "Mobile" if ua.is_mobile else "Tablet" if ua.is_tablet else "Other",
            "browser": ua.browser.family,
            "operating_system": ua.os.family,
            "login_frequency": login_frequency,
            "anomaly_score": 0.0,
            "anomaly_reason": "N/A",
            "status": "pending"
        }

        if not user or not user.verify_password(user_login.password):
            if user: # Log failed attempt for existing user
                details["anomaly_reason"] = "Invalid credentials"
                details["status"] = "failed"
                create_login_activity(db, user.id, user.email, ip_address, user_agent_str, False, True, "High", details)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )
        
        # --- Anomaly Detection on Successful Login ---
        anomaly_detected = False
        risk_level = "Low"
        details["status"] = "success"
        
        # Rule: First login is always normal.
        if not login_history:
            risk_level = "Normal (First Login)"
            details["anomaly_reason"] = "First-time login for user"
        elif pipeline:
            features_df = create_features_for_live_login(user_login.user_agent, db, user, request, login_frequency)
            model_is_anomaly, model_score, error_msg = get_model_prediction(pipeline, features_df)

            if error_msg:
                # If there was an error, log it as a high-risk anomaly
                anomaly_detected = True
                risk_level = "High"
                details["anomaly_score"] = 0.0
                details["anomaly_reason"] = error_msg
            else:
                # --- Hybrid Priority Calculation (based on user's new script) ---
                
                # 1. Calculate Rule-Based Score
                is_new_ip = features_df['is_new_ip'].iloc[0]
                is_new_browser = features_df['is_new_browser'].iloc[0]
                is_unusual_hour = features_df['is_unusual_hour'].iloc[0]
                
                rule_based_score = is_new_ip + is_new_browser + is_unusual_hour

                # 2. Determine Priority Level
                if model_is_anomaly or rule_based_score >= 2:
                    risk_level = "High"
                elif rule_based_score == 1:
                    risk_level = "Medium"
                else:
                    risk_level = "Low"
                
                anomaly_detected = risk_level in ["High", "Medium", "Critical"]
                details["anomaly_score"] = model_score
                
                # --- Detailed Reason Finding ---
                if anomaly_detected:
                    reasons_list = []
                    if is_new_browser: reasons_list.append("new browser")
                    if is_new_ip: reasons_list.append("new IP address")
                    if is_unusual_hour: reasons_list.append("unusual login time")
                    
                    if reasons_list:
                        details["anomaly_reason"] = f"Suspicious login flagged. Reasons: {', '.join(reasons_list)}."
                    # Fallback if rules don't catch it but model does
                    elif model_is_anomaly:
                        details["anomaly_reason"] = f"Suspicious login flagged by ML model (Score: {model_score:.4f})"
                else:
                    details["anomaly_reason"] = "Normal login (model score below threshold)"
    
                # --- Console Log ---
                print("\n--- FEATURES FOR MODEL PREDICTION ---")
                print(features_df.to_string())
                print("-------------------------------------\n")
                print("--- ANOMALY DETECTION LOG ---")
                print(f"User: {user.email}")
                print(f"Is Anomaly: {anomaly_detected}")
                print(f"Anomaly Score: {details['anomaly_score']:.4f}")
                print(f"Anomaly Reason: {details['anomaly_reason']}")
                print("-----------------------------\n")
        else:
            details["anomaly_reason"] = "Normal login (model not loaded)"
            risk_level = "Low" # Ensure it's low when model isn't there

        # Anomaly detection determines if the login is "successful" from a security perspective
        final_login_successful = risk_level in ["Low", "Normal (First Login)"]
        details["status"] = "success" if final_login_successful else "failed"

        # Record login activity
        create_login_activity(db, user.id, user.email, ip_address, user_agent_str, final_login_successful, anomaly_detected, risk_level, details)

        # This should be returned regardless of outcome
        response_data = {
        "message": "Login successful",
        "user_id": user.id,
            "anomaly_detected": anomaly_detected,
            "risk_level": risk_level,
            "anomaly_details": {"score": details["anomaly_score"], "message": details["anomaly_reason"]}
        }
    
    except Exception as e:
        print(f"An unexpected error occurred during login: {e}")
        # Return a standard error response
        return JSONResponse(status_code=500, content={"message": "An internal server error occurred."})

    return response_data 