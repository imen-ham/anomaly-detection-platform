FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# On expose le port 8080 qui est le standard Cloud Run
EXPOSE 8080

# On utilise la variable d'environnement PORT injectée par Cloud Run (ou 8080 par défaut)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
