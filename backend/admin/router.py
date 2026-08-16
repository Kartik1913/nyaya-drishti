from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import require_role
from seed.loader import load_seed_data

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/reseed", status_code=status.HTTP_200_OK)
def trigger_reseed(
    current_user=Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """
    Wipe and re-seed all synthetic case data from seed_data.json.
    Admin role only. Safe to call repeatedly for demo resets.
    Does NOT affect the users table.
    """
    try:
        result = load_seed_data(db)
        return {
            "status": "ok",
            "cases_loaded": result["cases_loaded"],
            "cohort_stats_loaded": result["cohort_stats_loaded"],
            "aggregate_context_loaded": result.get("aggregate_context_loaded", 0),
            "engine_run_date": result["engine_run_date"],
            "verification": result.get("verification", {}),
        }
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Reseed failed: {exc}",
        )


