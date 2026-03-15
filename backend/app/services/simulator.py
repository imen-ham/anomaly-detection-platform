import random
import uuid
from datetime import datetime

MERCHANTS = ["Amazon", "Carrefour", "SNCF", "Apple Store", "Netflix",
             "Total Energies", "McDonald's", "Uber", "Airbnb", "Fnac"]
CATEGORIES = ["e-commerce", "alimentation", "transport", "tech", "streaming",
              "energie", "restauration", "mobilite", "voyage", "loisirs"]
COUNTRIES_NORMAL = ["FR", "FR", "FR", "DE", "ES", "IT", "BE"]
COUNTRIES_SUSPECT = ["RU", "NG", "CN", "KP", "IR"]

def generate_transaction(user_id: str = None) -> dict:
    if user_id is None:
        user_id = str(uuid.uuid4())
    is_anomaly = random.random() < 0.07
    if is_anomaly:
        pattern = random.choice(["high_amount", "foreign", "both"])
        if pattern == "high_amount":
            amount = round(random.uniform(8000, 50000), 2)
            country = random.choice(COUNTRIES_NORMAL)
        elif pattern == "foreign":
            amount = round(random.uniform(200, 3000), 2)
            country = random.choice(COUNTRIES_SUSPECT)
        else:
            amount = round(random.uniform(5000, 30000), 2)
            country = random.choice(COUNTRIES_SUSPECT)
    else:
        amount = round(random.uniform(5, 1500), 2)
        country = random.choice(COUNTRIES_NORMAL)
    idx = random.randint(0, len(MERCHANTS) - 1)
    return {
        "user_id": user_id,
        "amount": amount,
        "currency": "EUR",
        "merchant": MERCHANTS[idx],
        "category": CATEGORIES[idx],
        "country": country,
    }

def generate_bulk(n: int = 10) -> list:
    user_ids = [str(uuid.uuid4()) for _ in range(5)]
    return [generate_transaction(random.choice(user_ids)) for _ in range(n)]