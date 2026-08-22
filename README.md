# Nyaya-Drishti — Frontend

An AI-assisted judicial pendency triage platform for court administrators.
This is the production React frontend, generated from the Stitch UI
prototype (`stitch_nyaya_judicial_triage_platform.zip`) covering five
screens: the public landing page, the district dashboard, the triage
priority queue, the case scoring inspector, and the Lok Adalat referral
review queue.

Built for the SIH internal selection round — Team Diamond (SIH26_94).

## Stack

- **React 19** + **Vite** — app shell and dev/build tooling
- **React Router v7** — client-side routing between the 5 screens
- **Tailwind CSS 3** — utility-first styling, configured with the exact
  design tokens (colors, type scale, spacing, radii) from the Stitch
  `DESIGN.md` design system ("Nyaya Institutional Framework")
- **Material Symbols Outlined** + **Google Fonts** (Source Serif 4 /
  Public Sans) — loaded via `index.html`

No backend is wired up yet — all case/queue data lives in
`src/data/mockData.js` as placeholder data standing in for the eventual
eCourts/NJDG-fed triage API.

## Getting started

\`\`\`bash
npm install
npm run dev       # start the dev server (http://localhost:5173)
npm run build     # production build -> dist/
npm run preview   # preview the production build locally
\`\`\`

## Project structure

\`\`\`
src/
  components/       Shared, reusable UI pieces
    Icon.jsx          Material Symbols glyph wrapper
    Sidebar.jsx        Fixed left nav for the authenticated app shell
    AiNotice.jsx        "Assistive AI" disclosure pill
    UserActions.jsx     Notification / account icon cluster
    AppFooter.jsx        Footer used on every authenticated page
    Badge.jsx             Status/likelihood pill
    Switch.jsx             Accessible toggle used on the Priority Queue filter
    LandingNav.jsx           Public marketing nav bar
    LandingFooter.jsx         Public marketing footer

  layouts/
    AppLayout.jsx      Wraps the 4 authenticated routes with <Sidebar /> + <Outlet />

  pages/
    Landing.jsx                Public landing page ("/")
    Dashboard.jsx               District Overview ("/dashboard")
    PriorityQueue.jsx            Triage Priority Queue ("/priority-queue")
    CaseInspector.jsx             Case scoring transparency ("/case-inspector")
    LokAdalatDrafts.jsx            Lok Adalat referral review ("/lok-adalat-drafts")
    NotFound.jsx                   404 fallback

  data/
    navigation.js       Sidebar nav item config
    mockData.js          All placeholder content: KPIs, case rows, landing copy
\`\`\`

## Design system notes

The Tailwind config (`tailwind.config.js`) mirrors the Stitch design
tokens 1:1 — semantic color names like `surface-container-low`,
`on-surface-variant`, `secondary-container`, etc. are available as
Tailwind utilities (`bg-surface-container-low`, `text-on-surface-variant`,
…) exactly as they were in the original prototype markup, so future
screens exported from Stitch can be dropped in with minimal translation.

Typography pairs **Source Serif 4** (headlines — "the record") with
**Public Sans** (UI/body — legibility for data-heavy screens), per the
brand pillars in the original `DESIGN.md`: Trust, Clarity, Evidence,
Infrastructure.

## Routes

| Path                | Screen                                  |
| ------------------- | ---------------------------------------- |
| `/`                  | Institutional landing page              |
| `/dashboard`          | District Overview (KPIs + charts)      |
| `/priority-queue`      | Triage priority queue table + filters |
| `/case-inspector`       | Side-by-side scoring transparency    |
| `/lok-adalat-drafts`     | Settlement / Lok Adalat referral review |

## Next steps

- Replace `src/data/mockData.js` with real API calls (e.g. React Query)
  once the triage backend (KJS-HC-03 pipeline / eCourts ingestion) is
  ready.
- Wire up auth for the district registrar / judge / DLSA secretary
  personas described on the landing page.
- Add real pagination + server-side filtering to the Priority Queue and
  Lok Adalat review tables.
