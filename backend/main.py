import os
import warnings
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
from models import User
from auth.utils import get_password_hash
from auth.router import router as auth_router
from cases.router import router as cases_router
from cohort.router import router as cohort_router
from triage_queue.router import router as queue_router
from stats.router import router as stats_router
from demo.router import router as demo_router
from admin.router import router as admin_router
from seed.loader import load_seed_data
from models import Case




@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create all database tables if they don't exist
    Base.metadata.create_all(bind=engine)

    # Seed default users. Passwords are loaded from .env.
    # In development, a warning is emitted if defaults are used.
    # In any other APP_ENV, missing passwords are a hard error.
    db = SessionLocal()
    _app_env = os.getenv("APP_ENV", "development").lower()
    _dev_admin = "admin123"
    _dev_registry = "registry123"

    admin_pass = os.getenv("ADMIN_PASSWORD")
    registry_pass = os.getenv("REGISTRY_PASSWORD")

    if not admin_pass:
        if _app_env == "development":
            warnings.warn("ADMIN_PASSWORD not set — using insecure dev default. Set in backend/.env.")
            admin_pass = _dev_admin
        else:
            # Hard fail for APP_ENV=demo and APP_ENV=production (see PLAN.md secret policy).
            raise RuntimeError(
                f"FATAL: ADMIN_PASSWORD is required when APP_ENV={_app_env!r}. "
                "Set it in backend/.env."
            )

    if not registry_pass:
        if _app_env == "development":
            warnings.warn("REGISTRY_PASSWORD not set — using insecure dev default. Set in backend/.env.")
            registry_pass = _dev_registry
        else:
            raise RuntimeError(
                f"FATAL: REGISTRY_PASSWORD is required when APP_ENV={_app_env!r}. "
                "Set it in backend/.env."
            )


    try:
        if not db.query(User).filter(User.username == "admin").first():
            db.add(User(username="admin", password_hash=get_password_hash(admin_pass), role="admin"))

        if not db.query(User).filter(User.username == "registry").first():
            db.add(User(username="registry", password_hash=get_password_hash(registry_pass), role="registry_staff"))

        db.commit()
    finally:
        db.close()

    # Auto-seed case data on first launch (idempotent: only runs if no cases in DB)
    seed_db = SessionLocal()
    try:
        if not seed_db.query(Case).first():
            try:
                result = load_seed_data(seed_db)
                print(f"[startup] Seeded {result['cases_loaded']} cases, "
                      f"{result['cohort_stats_loaded']} cohort stat rows.")
            except FileNotFoundError:
                print("[startup] WARNING: seed_data.json not found. "
                      "Run 'python -m seed.generator' then 'python -m seed.loader'.")
    finally:
        seed_db.close()

    yield
    # Shutdown logic if needed


app = FastAPI(
    title="Nyaya-Drishti API",
    description="AI-Based Judicial Pendency Triage System Prototype for District Courts",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for Vite React frontend
_cors_origins_env = os.getenv("CORS_ORIGINS")
if _cors_origins_env and _cors_origins_env.strip():
    _allowed_origins = [origin.strip() for origin in _cors_origins_env.split(",") if origin.strip()]
else:
    _allowed_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register endpoint routers
app.include_router(auth_router)
app.include_router(cases_router)
app.include_router(cohort_router)
app.include_router(queue_router)
app.include_router(stats_router)
app.include_router(demo_router)
app.include_router(admin_router)



@app.get("/")
def read_root():
    return {
        "name": "Nyaya-Drishti API",
        "status": "running",
        "version": "1.0.0",
        "disclaimer": "This system provides administrative review priority only. It does not predict judicial outcomes or evaluate judges. All case-level data is SYNTHETIC."
    }
