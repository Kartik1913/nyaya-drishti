/**
 * One-shot "entering the courtroom" gate.
 *
 * The entrance animation must fire exactly once per session, at the moment the
 * user crosses from the public side of the app into the authenticated
 * workspace — i.e. right after a successful login, or when they click an
 * "Enter Dashboard" call-to-action on the landing page. It must NOT replay
 * every time they navigate back to the dashboard, refresh, or move between
 * workspace pages, because a 1.5s ceremony on every click would become a tax
 * on the demo rather than a delight.
 *
 * We coordinate that with a single sessionStorage flag: the entry points
 * `arm()` it, and the workspace layout `consume()`s it on mount. sessionStorage
 * (not localStorage) so a brand-new tab/session gets the ceremony again, but a
 * refresh within the same session does not re-arm it on its own.
 */

const KEY = "nyaya:entrance";

/** Mark that the next arrival in the workspace should play the entrance. */
export function armEntrance() {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    // Private mode / storage disabled — the entrance simply won't play, which
    // is a fine degradation. Never let this throw into a navigation handler.
  }
}

/** True if the entrance is currently armed (without clearing it). */
export function isEntranceArmed() {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** Clear the armed flag once the entrance has actually started/finished. */
export function clearEntrance() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* no-op */
  }
}
