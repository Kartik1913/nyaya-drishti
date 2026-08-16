from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Case
from schemas import ComparisonResponse, CaseOut
from auth.dependencies import get_current_user

router = APIRouter(prefix="/demo", tags=["demo"])


@router.get("/comparison", response_model=ComparisonResponse)
def get_demo_comparison(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    stalled = db.query(Case).filter(Case.is_demo_stalled == True).first()
    progressing = db.query(Case).filter(Case.is_demo_progressing == True).first()

    return ComparisonResponse(
        stalled_case=CaseOut.model_validate(stalled) if stalled else None,
        progressing_case=CaseOut.model_validate(progressing) if progressing else None
    )
