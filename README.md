# anomaly-detection-platform

## Separation Frontend / Backend

Le projet est configure pour executer le frontend et le backend comme deux services distincts.

### Ports

- Backend API: http://localhost:8001
- Frontend (Vite): http://localhost:5174
- Postgres: localhost:5432

### Lancement local separe

1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Optionnel frontend (`frontend/.env`):

```env
VITE_API_BASE_URL=http://localhost:8001/api
```

### Lancement Docker Compose

```bash
docker compose up --build
```

Services exposes:

- Frontend: http://localhost:5174
- Backend: http://localhost:8001

### CORS backend

Le backend lit `CORS_ORIGINS` (liste separee par des virgules).
Par defaut: `http://localhost:5173,http://localhost:5174`.