# Backend API (FastAPI)

## Setup

1. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
2. Set up PostgreSQL with database `applications`, user `postgres`, password `abc`.
3. Run migrations (create tables):
   ```sh
   python -c "from db import Base, engine; Base.metadata.create_all(bind=engine)"
   ```
4. Start the server:
   ```sh
   uvicorn app:app --reload
   ```

## Architecture & Technologies
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL (via SQLAlchemy ORM)
- **Password Hashing:** passlib (bcrypt)
- **ML Model:** Anomaly detection for login security (joblib, scikit-learn)
- **Data Validation:** Pydantic
- **API Structure:** Modular routers (e.g., /auth/signup, /auth/login)

## Anomaly Detection Logic
- The backend uses a hybrid approach for detecting suspicious logins:
  - **User-specific login time:** Flags logins as unusual if the login hour is outside the user’s typical window (average ± max(2, 2×std deviation) of previous successful login hours).
  - **New IP/Browser:** Flags if the login is from a new IP address or browser family.
  - **ML Model:** A machine learning model (loaded from `model/login_anomaly_model.pkl`) analyzes login features for anomalies.
  - **Hybrid Decision:** If the ML model or rule-based score is high, the login is flagged as an anomaly and the user is warned.

## Endpoints
- `/auth/signup` — Register a new user
- `/auth/login` — User login with anomaly detection