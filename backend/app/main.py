from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from .database import engine, Base
from .routes import transactions, alerts, analytics

# Crée les tables automatiquement au démarrage
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Anomaly Detection API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

Instrumentator().instrument(app).expose(app)

app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "anomaly-detection-api"}