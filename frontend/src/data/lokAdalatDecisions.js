// Shared localStorage-backed store for Lok Adalat approve/reject decisions.
// Used by LokAdalatDrafts, and the Approved/Rejected pages, so a decision
// made on any one of them is immediately visible on the others.
export const DECISIONS_STORAGE_KEY = "lokAdalatDecisions";

export function loadStoredDecisions() {
  try {
    const raw = localStorage.getItem(DECISIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function persistDecisions(next) {
  try {
    localStorage.setItem(DECISIONS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private browsing, quota) — decision still
    // applies for this session, just won't survive a refresh.
  }
  return next;
}
