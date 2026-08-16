# Nyaya-Drishti

## Formal Title

AI-Based Judicial Pendency Triage System for Prioritising Structurally Stalled Cases in District Courts

## Project Type

Smart India Hackathon (SIH) prototype.

## Core Idea

Nyaya-Drishti is an administrative queue-triage system for district courts.

The system identifies pending cases that appear structurally stalled rather than simply old, estimates the likely administrative bottleneck, and produces an explainable priority ranking for court registry/administrative staff.

The system does NOT predict judicial outcomes, determine who will win a case, recommend judicial decisions, or evaluate judges.

Its purpose is administrative queue management.

## Problem

District courts have a large pending-case backlog. Existing systems such as NJDG provide monitoring and statistics about pendency and case age, but the key operational question remains:

"Which pending cases should administrative staff look at first, and why?"

An old case may still be progressing normally through hearings. Another case of similar age may have been stuck for a long period because of an unresolved procedural or administrative bottleneck.

Nyaya-Drishti aims to distinguish these cases.

## Core Differentiator

Age alone should not determine priority.

The system should compare a case with a suitable cohort of comparable cases and identify significant deviations from normal progression.

The central demonstration should contrast:

1. An old case that is still progressing normally.
2. An old case that is structurally stalled.

The second should receive a higher administrative-review priority, with an evidence-based explanation.

## Data Strategy

Use official government data wherever legitimately available.

Potential sources:

- data.gov.in
- National Judicial Data Grid (NJDG)
- eCourts

Real government aggregate statistics such as pendency, age buckets, case-type distributions, and court/district summaries should be used for contextual statistics and to calibrate the prototype's synthetic dataset.

Do NOT assume an unrestricted public bulk API for complete eCourts case histories.

Do NOT bypass CAPTCHA, access controls, authentication, rate limits, or other restrictions.

If complete event-level case histories cannot be legitimately obtained in bulk, use synthetic/anonymized case timelines for the prototype.

Synthetic case records must be clearly labelled as synthetic and must never be presented as real litigant records.

## Data Model Direction

The prototype should support case-level fields resembling official eCourts/NJDG concepts, such as:

- case ID / synthetic CNR-like identifier
- state
- district
- court establishment
- case type
- acts/sections
- filing date
- registration date
- pending since
- current status
- current stage
- next date
- disposal information where applicable

Case events should represent concepts such as:

- hearing
- order
- adjournment
- summons issued
- summons returned
- witness examination
- judge change/interruption

The prototype may derive additional administrative indicators such as:

- summons/service status
- witness status
- unresolved procedural step
- adjournment count
- judge-change count
- days since meaningful activity

These derived indicators must be clearly distinguished from source data.

## Normal Progression

Cases should be compared against a narrow cohort rather than all cases.

The initial cohort concept should consider:

- court establishment
- case type
- acts/section bucket
- filing-year bucket

Judge identity must NOT be used as a cohort key or performance metric.

Judge changes may be treated as an event within an individual case timeline where appropriate.

Small cohorts should produce a low-confidence result rather than a misleading comparison.

## Triage Approach

For version 1, prefer an explainable hybrid of rules and statistics rather than a black-box supervised ML model.

Recommended conceptual layers:

1. Cohort-based expected progression.
2. Statistical deviation/stall detection.
3. Deterministic bottleneck classification.
4. Administrative actionability classification.
5. Explainable priority score.

Potential bottlenecks include:

- summons/service delay
- witness-related delay
- procedural inactivity
- repeated adjournments
- judge-transfer/interruption
- other/unknown

The "unknown" category must exist.

Do not force every case into a confident bottleneck.

## Priority

Priority should represent:

"priority for administrative review"

It must NOT represent:

"likelihood of judicial outcome."

The score may consider:

- structural deviation
- inactivity
- case age
- procedural blockage
- administrative actionability

Weights must be treated as configurable heuristics until real institutional data exists for calibration.

## Explainability

Every priority score must be traceable to actual stored evidence.

For example:

- days since meaningful event
- cohort median/percentile
- time in current stage
- case age
- unresolved procedural indicator
- adjournment count

Do not allow an LLM to invent reasons.

Template-based explanations should be the default.

An LLM, if introduced later, may only paraphrase an already-generated evidence bundle.

## Primary User

District court registry/administrative staff.

The system should help answer:

"Which pending cases appear structurally stalled and may be administratively actionable?"

## MVP

The minimum viable prototype should contain:

1. Dashboard
2. Ranked priority queue
3. Case detail/timeline
4. Evidence-based explanation
5. Old-but-progressing vs old-and-stalled comparison

Optional features should not distract from the core triage engine.

## Technology Direction

Prefer a simple hackathon-friendly architecture.

Current recommendation:

Frontend:
- React
- Vite
- Tailwind
- Recharts

Backend:
- FastAPI
- Python

Database:
- SQLite initially

Data processing:
- Python
- pandas
- NumPy

scikit-learn should only be introduced if an optional anomaly-detection experiment is genuinely useful.

Avoid unnecessary microservices and infrastructure.

## Security and Privacy

The prototype should avoid real litigant PII.

Do not expose real party names.

Do not create judge-performance rankings.

Use synthetic/anonymized identifiers.

The architecture should consider:

- access control
- audit logging
- PII minimization
- secure API design
- restricted visibility of triage outputs

## SIH Demo

The demo should tell this story:

1. Show real aggregate pendency context from government sources.
2. Show that simply sorting by age is insufficient.
3. Run Nyaya-Drishti triage.
4. Show the ranked queue.
5. Open a high-priority case.
6. Show its timeline against comparable-case progression.
7. Show the exact evidence behind its score.
8. Show the likely administrative bottleneck.
9. Compare it with an old case that is progressing normally.
10. Explicitly demonstrate that the system does not predict judicial outcomes or evaluate judges.

## Hard Constraints

- Do not fabricate government statistics.
- Clearly distinguish real aggregate data from synthetic case-level data.
- Do not bypass eCourts security/access mechanisms.
- Do not claim an unrestricted eCourts bulk API unless officially verified.
- Do not predict judicial outcomes.
- Do not evaluate judges.
- Prioritize structurally stalled and potentially administratively actionable cases.
- Make explanations evidence-based.
- Keep the prototype achievable for a small SIH team.
- Do not over-engineer the solution.

## Planning Rule

This BRIEF is the seed for the Wednesday Greenfield planning workflow.

The Greenfield Planner should challenge these assumptions where necessary, identify tensions, and produce the final implementation plan.

Do not write application code during planning.
