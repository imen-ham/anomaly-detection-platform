from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..database import get_db
from ..models import Alert

router = APIRouter()

@router.get("/")
def get_alerts(resolved: bool = None, db: Session = Depends(get_db)):
    query = db.query(Alert)
    if resolved is not None:
        query = query.filter(Alert.resolved == resolved)
    return query.order_by(desc(Alert.created_at)).limit(100).all()

@router.patch("/{alert_id}/resolve")
def resolve_alert(alert_id: str, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        return {"error": "Alert not found"}
    alert.resolved = True
    db.commit()
    db.refresh(alert)
    return alert