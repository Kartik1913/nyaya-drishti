# Nyaya-Drishti Synthetic Event Dataset Manifest

## What was generated
- `synthetic_cases_10000.csv`: 10,000 synthetic active-case records.
- `synthetic_case_events.csv`: 99,440 synthetic timeline events.
- `synthetic_cohort_stats.csv`: 4,505 synthetic cohort baselines.
- `ml_training_matrix_synthetic.csv`: 10,000-row ML-ready matrix.

## Provenance
The generator is informed by the audited real judicial dataset profile supplied by the team:
- 3,179 unique disposed cases
- 14 columns
- 19 states
- 5 case types
- 332 courts
- 1,509 district-court records / 1,670 high-court records in the reference profile
- Available historical fields include court, state, case type, filing/decision dates, filing year, tier, and case duration.

The eCourts case-detail screenshot supplied by the team was used as the schema reference for case-level fields such as:
- Case type
- Filing/registration date
- CNR
- First/next hearing date
- Case stage
- Court/judge
- Acts/sections
- Process/event history concepts

## Critical data-label rule
All generated records are `SYNTHETIC_AUGMENTED`.
They are NOT real hearing histories and must not be presented as real court-event records.

## Event design
Each synthetic case receives a coherent event timeline with event types:
- REGISTRATION
- HEARING
- ORDER
- ADJOURNMENT
- SUMMONS_ISSUED
- SUMMONS_RETURNED (where applicable)
- WITNESS_EXAM
- JUDGE_CHANGE
- STAGE_TRANSITION / STAGE_SNAPSHOT

## Triage design
The synthetic data supports:
- Cohort-relative stage deviation
- Inactivity
- Adjournment streak
- Judge-change count
- Actionability
- Explainable weighted triage score
- HIGH/LOW confidence based on cohort size
- Structural stall labels for ML development

## Important
Synthetic structural-stall labels are scenario labels created by the generator. They are suitable for pipeline development, unit tests, and controlled experiments, but are NOT real judicial ground truth.

## Demo anchors
- CASE-ALPHA: SYN/PUN/CS/2021/000001, triage score 91.4, SUMMONS_DELAY, 287 days in stage, 4.42x deviation, 5 consecutive adjournments.
- CASE-BETA: SYN/PUN/CS/2021/000002, triage score 14.7, normal progression, 45 days in stage, 21 days since substantive event.

## Current reference limitation
The audited real CSV contains no event history. Therefore the synthetic event histories here are generated rather than observed.

