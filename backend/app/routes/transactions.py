from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..database import get_db
from ..models import Transaction, Alert
from ..services.anomaly_detector import detect_anomaly
from ..services.simulator import generate_bulk
from datetime import datetime

router = APIRouter()

@router.get("/")
def get_transactions(
    skip: int = 0,
    limit: int = 100,
    anomaly_only: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(Transaction)
    if anomaly_only:
        query = query.filter(Transaction.is_anomaly == True)
    return query.order_by(desc(Transaction.timestamp)).offset(skip).limit(limit).all()


@router.post("/")
def create_transaction(data: dict, db: Session = Depends(get_db)):
    tx = Transaction(**data)
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
                message=f"Transaction suspecte detectee : {reason} (score: {score})"
            )
            db.add(alert)

    db.commit()
    db.refresh(tx)
    return tx


@router.post("/simulate")
def simulate_transactions(payload: dict, db: Session = Depends(get_db)):
    count = payload.get("count", 10)
    results = []

    for tx_data in generate_bulk(count):
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
                    severity="critical" if score > 0.7 else "high",
                    message=f"Transaction suspecte : {reason} (score: {score})"
                )
                db.add(alert)

        results.append(tx)

    db.commit()
    return {
        "simulated": count,
        "anomalies": sum(1 for t in results if t.is_anomaly)
    }