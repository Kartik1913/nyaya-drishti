from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Date, DateTime, Text, ForeignKey,
    CheckConstraint, UniqueConstraint
)

from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('admin', 'registry_staff')", name="ck_users_role"),
    )

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)

    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="registry_staff")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))



class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    synthetic_cnr = Column(String, unique=True, index=True, nullable=False)
    state = Column(String, nullable=False, default="Maharashtra")
    district = Column(String, nullable=False, default="Pune")
    court_establishment = Column(String, nullable=False, default="Pune District Court")
    case_type = Column(String, nullable=False, default="CS")  # e.g., 'CS' (Civil Suit)
    act_section_bucket = Column(String, nullable=False, default="CPC_GENERAL")

    filing_date = Column(Date, nullable=False)
    registration_date = Column(Date, nullable=True)
    pending_since = Column(Date, nullable=False)
    current_status = Column(String, nullable=False, default="Pending")
    current_stage = Column(String, nullable=False, default="Summons / Appearance")
    # stage_entered_at: the calendar date when the case transitioned into current_stage.
    # This is the primary auditable field for computing days_in_current_stage.
    # It is set by the seed generator from the STAGE_TRANSITION event date.
    stage_entered_at = Column(Date, nullable=True)
    next_date = Column(Date, nullable=True)

    # Derived / Triage engine fields
    triage_score = Column(Float, nullable=True, index=True)  # 0.0 – 100.0
    triage_confidence = Column(String, nullable=True, default="HIGH")  # 'HIGH' | 'MEDIUM' | 'LOW'
    bottleneck_type = Column(String, nullable=True, default="UNKNOWN")
    # 'SUMMONS_DELAY' | 'WITNESS_DELAY' | 'PROCEDURAL_INACTIVITY' | 'REPEATED_ADJOURNMENT' | 'JUDGE_CHANGE' | 'UNKNOWN'

    days_since_substantive_event = Column(Integer, nullable=True)  # computed by triage engine
    days_in_current_stage = Column(Integer, nullable=True)          # = today - stage_entered_at
    # stage_deviation_ratio: days_in_current_stage / cohort median days in same stage.
    # Pre-computed and stored so the evidence bundle can cite it directly.
    stage_deviation_ratio = Column(Float, nullable=True)
    adjournment_streak = Column(Integer, default=0)  # consecutive adjournments (not total)
    adjournment_count = Column(Integer, default=0)   # total adjournment events
    judge_change_count = Column(Integer, default=0)

    cohort_size = Column(Integer, nullable=True)
    cohort_median_age = Column(Float, nullable=True)
    cohort_percentile = Column(Float, nullable=True)

    evidence_json = Column(Text, nullable=True)  # JSON payload of all score factors
    explanation_text = Column(Text, nullable=True)

    # Settlement Score (Lok Adalat referral signal) — separate from triage_score.
    # triage_score answers "how urgently does this case need administrative
    # attention"; settlement_score answers "how likely could this case be
    # resolved by mutual agreement instead of trial." Computed deterministically
    # in triage/settlement.py from current_stage, case age, and adjournment
    # streak — no ML, same philosophy as the main triage formula.
    settlement_score = Column(Float, nullable=True)          # 0.0 - 100.0
    settlement_likelihood = Column(String, nullable=True, default="LOW")  # 'HIGH' | 'MODERATE' | 'LOW'

    # Plain-language case summary generated from the same evidence bundle used
    # for explanation_text, but written as a standalone narrative rather than
    # an arithmetic justification.
    case_summary = Column(Text, nullable=True)

    is_demo_stalled = Column(Boolean, default=False)
    is_demo_progressing = Column(Boolean, default=False)
    data_label = Column(String, nullable=False, default="SYNTHETIC")

    __table_args__ = (
        CheckConstraint("data_label = 'SYNTHETIC'", name="ck_cases_data_label"),
        CheckConstraint("synthetic_cnr LIKE 'SYN/%'", name="ck_cases_synthetic_cnr"),
    )

    events = relationship("CaseEvent", back_populates="case", cascade="all, delete-orphan")



class CaseEvent(Base):
    __tablename__ = "case_events"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False, index=True)
    event_date = Column(Date, nullable=False)
    event_type = Column(String, nullable=False)
    # Valid event_type values:
    # 'HEARING' | 'ORDER' | 'ADJOURNMENT' | 'SUMMONS_ISSUED' | 'SUMMONS_RETURNED'
    # 'WITNESS_EXAM' | 'JUDGE_CHANGE' | 'STAGE_TRANSITION'
    # STAGE_TRANSITION events carry new_stage and are the authoritative record of
    # when a case moved into its current stage. They set Case.stage_entered_at.
    is_substantive = Column(Boolean, nullable=False, default=False)
    new_stage = Column(String, nullable=True)  # populated only for STAGE_TRANSITION events
    description = Column(Text, nullable=True)
    data_label = Column(String, nullable=False, default="SYNTHETIC")

    __table_args__ = (
        CheckConstraint("data_label = 'SYNTHETIC'", name="ck_case_events_data_label"),
        CheckConstraint(
            "event_type IN ("
            "'HEARING','ORDER','ADJOURNMENT','SUMMONS_ISSUED','SUMMONS_RETURNED',"
            "'WITNESS_EXAM','JUDGE_CHANGE','STAGE_TRANSITION')",
            name="ck_case_events_event_type",
        ),
    )

    case = relationship("Case", back_populates="events")



class CohortStat(Base):
    __tablename__ = "cohort_stats"
    __table_args__ = (
        # Enforce one record per unique cohort key — prevents duplicate cohort rows
        UniqueConstraint(
            "court_establishment", "case_type", "act_section_bucket",
            "filing_year_bucket", "current_stage",
            name="uq_cohort_key"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    court_establishment = Column(String, nullable=False)
    case_type = Column(String, nullable=False)
    act_section_bucket = Column(String, nullable=False)
    filing_year_bucket = Column(String, nullable=False)
    current_stage = Column(String, nullable=False)
    cohort_size = Column(Integer, nullable=False)
    median_age_days = Column(Float, nullable=False)
    p75_age_days = Column(Float, nullable=True)
    p90_age_days = Column(Float, nullable=True)
    median_days_in_stage = Column(Float, nullable=False)
    computed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class AggregateContext(Base):
    __tablename__ = "aggregate_context"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, nullable=False, default="NJDG")  # 'NJDG' | 'DATA_GOV_IN'
    metric_name = Column(String, nullable=False)
    metric_value = Column(String, nullable=False)
    as_of_date = Column(Date, nullable=True)
    data_label = Column(String, nullable=False, default="REAL_AGGREGATE")
    notes = Column(Text, nullable=True)

    __table_args__ = (
        CheckConstraint("data_label = 'REAL_AGGREGATE'", name="ck_aggregate_data_label"),
    )

