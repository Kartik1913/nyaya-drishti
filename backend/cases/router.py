from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database import get_db
from models import Case, CaseEvent
from schemas import CaseOut, CaseEventOut
from auth.dependencies import get_current_user

router = APIRouter(prefix="/cases", tags=["cases"])


@router.get("", response_model=List[CaseOut])
def get_cases(
    skip: int = 0,
    limit: int = 50,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Case).offset(skip).limit(limit).all()


@router.get("/{case_id}", response_model=CaseOut)
def get_case_detail(case_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return case


@router.get("/{case_id}/timeline", response_model=List[CaseEventOut])
def get_case_timeline(case_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return db.query(CaseEvent).filter(CaseEvent.case_id == case_id).order_by(CaseEvent.event_date.asc(), CaseEvent.id.asc()).all()
