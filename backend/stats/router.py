from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import AggregateContext
from schemas import AggregateContextOut
from auth.dependencies import get_current_user

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/aggregate", response_model=List[AggregateContextOut])
def get_aggregate_stats(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(AggregateContext).all()
