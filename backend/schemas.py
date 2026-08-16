from datetime import date, datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    role: str


class CaseEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_date: date
    event_type: str
    is_substantive: bool
    # new_stage is populated only for STAGE_TRANSITION events.
    # It records the stage the case entered at event_date.
    # This is the authoritative source for Case.stage_entered_at.
    new_stage: Optional[str] = None
    description: Optional[str] = None
    data_label: str = "SYNTHETIC"


class CaseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    synthetic_cnr: str
    state: str
    district: str
    court_establishment: str
    case_type: str
    act_section_bucket: str
    filing_date: date
    registration_date: Optional[date] = None
    pending_since: date
    current_status: str
    current_stage: str
    next_date: Optional[date] = None

    triage_score: Optional[float] = None
    triage_confidence: Optional[str] = "HIGH"
    bottleneck_type: Optional[str] = "UNKNOWN"

    days_since_substantive_event: Optional[int] = None
    days_in_current_stage: Optional[int] = None
    stage_entered_at: Optional[date] = None          # auditable: when case entered current_stage
    stage_deviation_ratio: Optional[float] = None    # days_in_stage / cohort_median_days_in_stage
    adjournment_streak: int = 0
    adjournment_count: int = 0
    judge_change_count: int = 0

    cohort_size: Optional[int] = None
    cohort_median_age: Optional[float] = None
    cohort_percentile: Optional[float] = None

    evidence_json: Optional[str] = None
    explanation_text: Optional[str] = None

    is_demo_stalled: bool = False
    is_demo_progressing: bool = False
    data_label: str = "SYNTHETIC"


class CohortStatOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    court_establishment: str
    case_type: str
    act_section_bucket: str
    filing_year_bucket: str
    current_stage: str
    cohort_size: int
    median_age_days: float
    median_days_in_stage: float
    data_label: str = "SYNTHETIC"


class AggregateContextOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source: str
    metric_name: str
    metric_value: str
    as_of_date: Optional[date] = None
    data_label: str = "REAL_AGGREGATE"
    notes: Optional[str] = None


class QueueResponse(BaseModel):
    total: int
    page: int
    limit: int
    cases: List[CaseOut]


class ComparisonResponse(BaseModel):
    stalled_case: Optional[CaseOut] = None
    progressing_case: Optional[CaseOut] = None
