def detect_anomaly(transaction) -> tuple:
    score = 0.0
    reasons = []

    # Règle 1 : montant très élevé
    if transaction.amount > 10000:
        score += 0.5
        reasons.append("high_amount")

    # Règle 2 : pays suspect
    suspicious_countries = ["RU", "NG", "KP", "IR"]
    if transaction.country in suspicious_countries:
        score += 0.4
        reasons.append("suspicious_country")

    # Règle 3 : montant élevé + pays étranger
    if transaction.amount > 3000 and transaction.country not in ["FR", "DE", "ES", "IT", "BE"]:
        score += 0.2
        reasons.append("foreign_high_amount")

    score = min(score, 1.0)
    is_anomaly = score >= 0.4

    return round(score, 3), is_anomaly, reasons