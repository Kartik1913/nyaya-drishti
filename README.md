# Nyaya-Drishti (AI-Based Judicial Pendency Triage System)

> **Prototype Disclaimer**: This system provides **administrative review triage only**. It does **NOT** predict judicial outcomes, evaluate judicial performance, or assign fault to judges. All case-level records and case proceedings are **100% SYNTHETIC** and generated under strict procedural constraints. Macro figures are sourced from NJDG and Data.gov.in.

---

## 🏛️ Project Overview

**Nyaya-Drishti** (*"Drishti"* meaning insight/sight) is an AI-based administrative triage system designed for district courts. In the current judicial system, pending cases sit in a homogeneous first-in-first-out queue where a case requiring substantive judicial deliberation looks identical to one stalled on a simple procedural bottleneck (such as an unserved summons).

Nyaya-Drishti evaluates cases across a **6-Layer Deterministic Triage Engine** to calculate an administrative actionability score ($0\text{–}100$), pinpointing registry-actionable bottlenecks without relying on uninterpretable black-box ML or LLM hallucinations.

---

## ⚙️ Architecture & 6-Layer Triage Engine

1. **Layer 1: Cohort Builder & Confidence Assessor**
   - Matches cases into 5-part cohort keys: `(court_establishment, case_type, act_section_bucket, filing_year_bucket, current_stage)`.
   - Enforces `LOW` confidence and suppresses percentile scoring when cohort size $n < 15$.
2. **Layer 2: Stall Detector**
   - Derives exact days in current stage from `STAGE_TRANSITION` events, dormancy duration since last substantive hearing, adjournment streaks, and recent bench changes.
3. **Layer 3: Bottleneck Classifier**
   - Deterministic rule cascade:
     - `SUMMONS_DELAY` (Rule 1): `SUMMONS_ISSUED` without return over $\ge 90\text{d}$ (High Actionability).
     - `WITNESS_DELAY` (Rule 2): Evidence stage + inactivity $\ge 180\text{d}$ (Medium Actionability).
     - `REPEATED_ADJOURNMENT` (Rule 3): Post-substantive streak $\ge 4$ (High Actionability).
     - `JUDGE_CHANGE` (Rule 4): Bench change within $365\text{d}$ + inactivity $\ge 120\text{d}$ (Medium Actionability, rendered as **"Bench Change"**).
     - `PROCEDURAL_INACTIVITY` (Rule 5): Fallback dormancy $\ge 120\text{d}$ (Medium Actionability).
     - `UNKNOWN` (Rule 6): Progressing normally (Low Actionability).
4. **Layer 4: Priority Scorer** (Approved Phase 0 Formula):
   $$\text{Score} = 0.30 \times \text{Structural Deviation} + 0.25 \times \text{Inactivity} + 0.15 \times \text{Age Deviation} + 0.10 \times \text{Adjournment Streak} + 0.20 \times \text{Actionability}$$
   - *Judge Change Grace Rule*: If a bench change occurred in the last $60\text{d}$, inactivity contribution is multiplied by $0.5$.
5. **Layer 5: Evidence Bundler**
   - Compiles a JSON payload with $\ge 15$ traceable metrics for full auditability.
6. **Layer 6: Explanation Generator**
   - Produces deterministic, template-matched text explaining the exact arithmetic factors. Zero LLM involvement.

---

## 🚀 Setup & Launch Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Local Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Environment variables (backend/.env)
# APP_ENV=development
# ADMIN_PASSWORD=admin123
# REGISTRY_PASSWORD=registry123
# SECRET_KEY=nyaya-drishti-dev-secret-key-32chars-min
# DATABASE_URL=sqlite:///nyaya.db (optional fallback)

# Generate seed data and run initial triage
python -m seed.generator
python -m seed.loader

# Launch backend API server (runs at http://localhost:8000)
uvicorn main:app --reload --port 8000
```

### 2. Local Frontend Setup
```bash
cd frontend

# Install npm dependencies
npm install

# Launch frontend development server (runs at http://localhost:5173)
npm run dev
```

---

## 🌐 Production Cloud Deployment Configuration

Nyaya-Drishti is pre-configured to deploy across Vercel, Render, and Supabase.

### 1. Database (Supabase PostgreSQL)
* Host a PostgreSQL instance on Supabase.
* Set the `DATABASE_URL` environment variable on Render to your Supabase connection string.

### 2. Backend (Render API Service)
* **Runtime**: Python 3.12.8
* **Build Command**: `pip install -r requirements.txt`
* **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
* **Required Environment Variables**:
  - `APP_ENV`: `production`
  - `DATABASE_URL`: `postgresql://<user>:<password>@<host>:<port>/postgres`
  - `SECRET_KEY`: `[Your Long Secure JWT Secret]`
  - `ADMIN_PASSWORD`: `[Your Production Admin Password]`
  - `REGISTRY_PASSWORD`: `[Your Production Registry Staff Password]`
  - `CORS_ORIGINS`: `https://nyaya-drishti-phi.vercel.app` (comma-separated list of allowed origins)

### 3. Frontend (Vercel SPA Web App)
* **Build Command**: `npm run build`
* **Output Directory**: `dist`
* **Environment Variables**:
  - `VITE_API_URL`: `https://nyaya-drishti-qjrd.onrender.com`
* **Client-Side Routing**:
  The React Single-Page Application relies on client-side routing. The frontend contains a `vercel.json` file directing Vercel to route all sub-paths back to `index.html` to prevent `404: NOT_FOUND` errors on page reloads:
  ```json
  {
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```

---

## 🧪 Running Automated Tests

Run backend unit and integration tests (RBAC, endpoints, 404/422 validation, $n < 15$ cohort confidence suppression):
```bash
cd backend
pytest tests/
```

---

## 🔄 Database Reseed & Reset

To reset the database to the deterministic baseline demo state (1,000 cases, Alpha score 91.4, Beta score 14.7):
- **CLI Method**:
  ```bash
  cd backend
  python -m seed.loader
  ```
- **UI / API Method**:
  - Log in with `admin` account and click the **"Reseed Demo DB"** button in the header navbar, or call:
  ```bash
  curl -X POST https://nyaya-drishti-qjrd.onrender.com/admin/reseed -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
  ```

---

## 🔑 Default Credentials (from environment files)

| Role | Username | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Full dashboard, Priority Queue, Case Details, Demo Comparison, Reseed DB |
| **Registry Staff** | `registry` | `registry123` | Full review access (Reseed restricted with 403 Forbidden) |

*(Quick-fill credential buttons are available directly on the `/login` screen for fast evaluation.)*

---

## ⏱️ 90-Second Demo Script

1. **Login (`0:00 – 0:15`)**:
   - Navigate to the deployed frontend url. Note the non-dismissible disclaimer.
   - Click the **"Admin Staff"** quick-fill button and sign in.
2. **Dashboard Overview (`0:15 – 0:35`)**:
   - Observe the 4 macro context cards tagged `[Source: NJDG]` / `[Source: DATA_GOV_IN]`.
   - Review the Pune District Court synthetic triage distribution and procedural bottleneck breakdown chart.
3. **Priority Queue (`0:35 – 0:55`)**:
   - Click **"Priority Queue"**.
   - Note that **CASE-ALPHA** is ranked **#1** with a priority score of **91.4** and a `Summons Delay` tag.
   - Demonstrate the bottleneck filter (e.g. filter by `Bench Change` or `Summons Delay`).
4. **Case Detail & Auditability (`0:55 – 1:15`)**:
   - Click on **CASE-ALPHA** to open `/cases/1`.
   - Walk through the **5-component score breakdown** (Structural: $26.49$, Inactivity: $23.92$, Age: $10.97$, Adjournment: $10.0$, Actionability: $20.0$).
   - Point out the **Cohort Benchmark Context** showing the case has spent $287\text{d}$ in stage ($4.42\times$ the $65\text{d}$ cohort median).
   - Scroll down the **Auditable Event Timeline** highlighting the `STAGE_TRANSITION` and `SUMMONS_ISSUED` provenance.
5. **Alpha vs. Beta Side-by-Side (`1:15 – 1:30`)**:
   - Click **"Demo Comparison"** in the navigation bar.
   - Contrast **CASE-ALPHA (Score 91.4)** vs **CASE-BETA (Score 14.7)**.
   - Conclude: *"Both cases are ~5 years old. Without Nyaya-Drishti, they look identical. With Nyaya-Drishti, registry staff can immediately unblock Alpha's missing summons return while letting Beta proceed with normal hearings."*