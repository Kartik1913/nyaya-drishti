from typing import List, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import AggregateContext, Case
from schemas import AggregateContextOut
from auth.dependencies import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/stats", tags=["stats"])


class TriageStatsOut(BaseModel):
    total_cases: int
    stalled_cases: int
    stalled_percentage: float
    bottlenecks: Dict[str, int]
    lok_adalat_eligible_count: int


@router.get("/aggregate", response_model=List[AggregateContextOut])
def get_aggregate_stats(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(AggregateContext).all()


@router.get("/triage", response_model=TriageStatsOut)
def get_triage_stats(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    total_cases = db.query(Case).count()
    stalled_cases = db.query(Case).filter(Case.triage_score >= 80.0).count()
    stalled_percentage = round((stalled_cases / total_cases * 100.0), 1) if total_cases > 0 else 0.0

    # Group by bottleneck type
    results = db.query(Case.bottleneck_type, func.count(Case.id)).group_by(Case.bottleneck_type).all()
    bottlenecks = {b_type: count for b_type, count in results if b_type}

    # Ensure all expected categories are present
    expected_types = [
        "SUMMONS_DELAY", "JUDGE_CHANGE", "WITNESS_DELAY", 
        "REPEATED_ADJOURNMENT", "PROCEDURAL_INACTIVITY", "UNKNOWN"
    ]
    for t in expected_types:
        if t not in bottlenecks:
            bottlenecks[t] = 0

    # Same eligibility signal Lok Adalat Drafts computes client-side (any
    # case not LOW) — computed here too so the Dashboard KPI and the Lok
    # Adalat Drafts page never disagree with each other again.
    lok_adalat_eligible_count = (
        db.query(Case).filter(Case.settlement_likelihood != "LOW").count()
    )

    return TriageStatsOut(
        total_cases=total_cases,
        stalled_cases=stalled_cases,
        stalled_percentage=stalled_percentage,
        bottlenecks=bottlenecks,
        lok_adalat_eligible_count=lok_adalat_eligible_count,
    )

