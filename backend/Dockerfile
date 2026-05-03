FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Port par défaut à 8000 pour la compatibilité locale (Docker Compose)
EXPOSE 8000

# Utilisation de 'exec' pour que Uvicorn reçoive directement les signaux d'arrêt (PID 1)
# Cloud Run injectera la variable $PORT (généralement 8080) au lancement
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
