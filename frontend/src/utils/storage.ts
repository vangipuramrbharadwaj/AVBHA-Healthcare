import type { SessionState } from "../types/auth";

const SESSION_KEY = "avbha.hms.session.v1";

export function loadSession(): SessionState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionState;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function saveSession(session: SessionState): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
