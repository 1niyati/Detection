from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker


from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from sqlalchemy import Column, Integer, String
from passlib.context import CryptContext

DATABASE_URL = "postgresql://postgres:abc@localhost:5432/application"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_blocked = Column(Boolean, default=False) # Add permanent block flag

    def verify_password(self, plain_password: str) -> bool:
        return pwd_context.verify(plain_password, self.hashed_password)

class LoginActivity(Base):
    __tablename__ = "login_activity"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    email = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String)
    country = Column(String, nullable=True) # Add country column
    asn = Column(Integer, nullable=True) # Add ASN column
    user_agent = Column(String)
    device_type = Column(String)
    browser = Column(String)
    operating_system = Column(String)
    login_successful = Column(Boolean)
    is_anomaly = Column(Boolean)
    anomaly_score = Column(Float, nullable=True)
    anomaly_reason = Column(String, nullable=True)
    # --- Missing columns to be added ---
    status = Column(String, nullable=True)
    severity = Column(String, nullable=True)
    login_frequency = Column(Integer, nullable=True)

    user = relationship("User")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_user(db, name: str, email: str, password: str):
    if db.query(User).filter(User.email == email).first():
        print(f"[create_user] User with email {email} already exists.")
        return None
    hashed_password = pwd_context.hash(password)
    user = User(name=name, email=email, hashed_password=hashed_password)
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
        print(f"[create_user] User created: {user.name}, {user.email}")
    except Exception as e:
        db.rollback()
        print(f"[create_user] Error creating user: {e}")
        return None
    return user

def authenticate_user(db, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user or not pwd_context.verify(password, user.hashed_password):
        return None
    return user
