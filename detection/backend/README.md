# Backend API (FastAPI)

## Setup

1. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
2. Set up PostgreSQL with database `applications`, user `postgres`, password `abc`.
3. Run migrations (create tables):
   ```sh
   python -c "from db import Base, engine; Base.metadata.create_all(bind=engine)"
   ```
4. Start the server:
   ```sh
   uvicorn app:app --reload
   ```

## Endpoints
- `