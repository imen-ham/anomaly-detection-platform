from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from .database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="EUR")
    merchant = Column(String)
    category = Column(String)
    country = Column(String)
    timestamp = Column(DateTime, default=datetime.now)
    is_anomaly = Column(Boolean, default=False)
    risk_score = Column(Float, default=0.0)
    status = Column(String, default="pending")

    alerts = relationship("Alert", back_populates="transaction")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = Column(String, ForeignKey("transactions.id"))
    alert_type = Column(String)
    severity = Column(String)
    message = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    resolved = Column(Boolean, default=False)

    transaction = relationship("Transaction", back_populates="alerts")