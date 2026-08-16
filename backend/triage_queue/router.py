from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Case
from schemas import QueueResponse, CaseOut
from auth.dependencies import get_current_user

router = APIRouter(prefix="/queue", tags=["queue"])


@router.get("", response_model=QueueResponse)
def get_priority_queue(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    bottleneck_filter: Optional[str] = None,
    confidence_filter: Optional[str] = None,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Case)
    if bottleneck_filter:
        query = query.filter(Case.bottleneck_type == bottleneck_filter)
    if confidence_filter:
        query = query.filter(Case.triage_confidence == confidence_filter)

    total = query.count()
    offset = (page - 1) * limit
    cases = query.order_by(Case.triage_score.desc().nullslast()).offset(offset).limit(limit).all()

    return QueueResponse(
        total=total,
        page=page,
        limit=limit,
        cases=[CaseOut.model_validate(c) for c in cases]
    )
