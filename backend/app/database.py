from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import time

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+pg8000://admin:admin123@postgres:5432/anomaly_db"
)

def create_engine_with_retry():
    retries = 10
    for i in range(retries):
        try:
            engine = create_engine(DATABASE_URL)
            engine.connect()
            print("Connexion DB réussie ✓")
            return engine
        except Exception as e:
            print(f"Tentative {i+1}/{retries} - DB pas prête, attente 3s...")
            time.sleep(3)
    raise Exception("Impossible de se connecter à la DB après 10 tentatives")

engine = create_engine_with_retry()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()