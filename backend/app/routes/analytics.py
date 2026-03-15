from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from ..database import get_db


router = APIRouter()

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(Transaction).count()
    anomalies = db.query(Transaction).filter(Transaction.is_anomaly == True).count()
    avg_risk = db.query(func.avg(Transaction.risk_score)).scalar() or 0
    return {
        "total": total,
        "anomalies": anomalies,
        "anomaly_rate": round((anomalies / total * 100) if total > 0 else 0, 2),
        "avg_risk_score": round(float(avg_risk), 3)
    }


@router.get("/daily")
def get_daily(db: Session = Depends(get_db)):
    rows = db.query(
        cast(Transaction.timestamp, Date).label("day"),
        func.count(Transaction.id).label("total"),
        func.count(Transaction.id).filter(Transaction.is_anomaly == True).label("anomalies")

    return [{"segment": k, "count": v} for k, v in segments.items()]