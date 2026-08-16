from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Case, CohortStat
from schemas import CohortStatOut
from auth.dependencies import get_current_user
from triage.config import cohort_year_bucket

router = APIRouter(prefix="/cases", tags=["cohort"])


@router.get("/{case_id}/cohort", response_model=CohortStatOut)
def get_case_cohort(case_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    # Look up the cohort stat record that matches this case's cohort key
    filing_year = case.filing_date.year if case.filing_date else None
    if filing_year is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Case has no filing date")

    year_bucket = cohort_year_bucket(filing_year)

    cohort = db.query(CohortStat).filter(
        CohortStat.court_establishment == case.court_establishment,
        CohortStat.case_type == case.case_type,
        CohortStat.act_section_bucket == case.act_section_bucket,
        CohortStat.filing_year_bucket == year_bucket,
        CohortStat.current_stage == case.current_stage,
    ).first()

    if not cohort:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No cohort statistics computed for this case's cohort key. "
                   f"(court={case.court_establishment}, type={case.case_type}, "
                   f"bucket={case.act_section_bucket}, year={year_bucket}, stage={case.current_stage})"
        )
    return cohort
