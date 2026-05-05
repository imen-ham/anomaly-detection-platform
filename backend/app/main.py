import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from .database import engine, Base, SessionLocal
from .routes import transactions, alerts, analytics, sre
from .models import Transaction, Alert
from .services.simulator import generate_bulk
from .services.anomaly_detector import detect_anomaly
from datetime import datetime

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Anomaly Detection API", version="1.0.0")

cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174")
cors_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

Instrumentator().instrument(app).expose(app)

app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(sre.router, prefix="/api/analytics", tags=["SRE"])

@app.on_event("startup")
def seed_data():
    db = SessionLocal()
    try:
        count = db.query(Transaction).count()
        if count == 0:
            print("DB vide - génération de 200 transactions initiales...")
            for tx_data in generate_bulk(200):
                tx = Transaction(**tx_data)
                tx.timestamp = datetime.now()
                score, is_anomaly, reasons = detect_anomaly(tx)
                tx.risk_score = score
                tx.is_anomaly = is_anomaly
                tx.status = "flagged" if is_anomaly else "validated"
                db.add(tx)
                db.flush()
                if is_anomaly:
                    for reason in reasons:
                        alert = Alert(
                            transaction_id=tx.id,
                            alert_type=reason,
                            severity="critical" if score > 0.7 else "high" if score > 0.5 else "medium",
                            message=f"Transaction suspecte: {reason} (score: {score})"
                        )
                        db.add(alert)
            db.commit()
            print("200 transactions générées avec succès ✓")
        else:
            print(f"DB déjà peuplée avec {count} transactions ✓")
    finally:
        db.close()

@app.get("/health")
def health():
    return {"status": "ok", "service": "anomaly-detection-api"}