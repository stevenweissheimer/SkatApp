/**
 * API-Client für Turnier-Operationen
 * Alle Aufrufe gegen /api/tournaments/…
 */

import { Tournament } from '@/types';

const BASE = '/api/tournaments';

export interface TournamentListItem {
  id: string;
  name: string;
  date: string;
  location: string;
  playerCount: number;
  seriesCount: number;
  gamesPerSeries: number;
  entryFee: number;
  hasPassword: boolean;
  createdAt: string;
}

/* ===== Passwort-Verwaltung (sessionStorage) ===== */

/** Gespeichertes Passwort für ein Turnier holen */
export function getStoredPassword(tournamentId: string): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(`skat-pw-${tournamentId}`);
}

/** Passwort für ein Turnier speichern */
export function setStoredPassword(tournamentId: string, password: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(`skat-pw-${tournamentId}`, password);
}

/** Gespeichertes Passwort löschen */
export function clearStoredPassword(tournamentId: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(`skat-pw-${tournamentId}`);
}

/* ===== Score-Token-Verwaltung (sessionStorage) ===== */

/** Gespeicherten Score-Token für ein Turnier holen */
export function getStoredScoreToken(tournamentId: string): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(`skat-token-${tournamentId}`);
}

/** Score-Token für ein Turnier speichern */
export function setStoredScoreToken(tournamentId: string, token: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(`skat-token-${tournamentId}`, token);
}

/** Headers für turnierspezifische Requests (inkl. Passwort/Token wenn vorhanden) */
function headersFor(tournamentId: string): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const pw = getStoredPassword(tournamentId);
  if (pw) h['x-tournament-password'] = pw;
  const token = getStoredScoreToken(tournamentId);
  if (token) h['x-score-token'] = token;
  return h;
}

/* ===== Hilfsfunktionen ===== */

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

/* ===== API-Funktionen ===== */

/** Alle Turniere als Liste */
export function listTournaments(): Promise<TournamentListItem[]> {
  return fetch(BASE).then((r) => handleResponse(r));
}

/** Einzelnes Turnier laden */
export function getTournament(id: string): Promise<Tournament> {
  return fetch(`${BASE}/${id}`, {
    headers: headersFor(id),
  }).then((r) => handleResponse(r));
}

/** Neues Turnier anlegen */
export function createTournament(data: {
  name: string;
  date: string;
  location?: string;
  seriesCount: number;
  gamesPerSeries: number;
  entryFee?: number;
  players: { id: string; name: string; club: string; note: string }[];
  prizePreset?: string;
  prizeRules?: { place: number; percent: number }[];
  extraPrizePool?: number;
  houseRules?: string;
  organizerName?: string;
  organizerContact?: string;
  password?: string;
}): Promise<Tournament> {
  return fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((r) => handleResponse(r));
}

/** Turnier-Einstellungen aktualisieren */
export function updateTournament(
  id: string,
  data: Partial<Tournament> & { password?: string },
): Promise<Tournament> {
  return fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: headersFor(id),
    body: JSON.stringify(data),
  }).then((r) => handleResponse(r));
}

/** Turnier löschen */
export function deleteTournament(id: string): Promise<void> {
  return fetch(`${BASE}/${id}`, {
    method: 'DELETE',
    headers: headersFor(id),
  }).then((r) => handleResponse(r));
}

/** Einzelnen Spielstand aktualisieren */
export function updateScore(
  tournamentId: string,
  data: {
    seriesNumber: number;
    tableNumber: number;
    gameNumber: number;
    playerId: string;
    score: number | null;
  },
): Promise<{ ok: boolean }> {
  return fetch(`${BASE}/${tournamentId}/score`, {
    method: 'PUT',
    headers: headersFor(tournamentId),
    body: JSON.stringify(data),
  }).then((r) => handleResponse(r));
}

/** Serie abschließen */
export function completeSeries(
  tournamentId: string,
  seriesNumber: number,
): Promise<Tournament> {
  return fetch(`${BASE}/${tournamentId}/series/${seriesNumber}/complete`, {
    method: 'PUT',
    headers: headersFor(tournamentId),
  }).then((r) => handleResponse(r));
}

/** Serie wieder öffnen */
export function reopenSeries(
  tournamentId: string,
  seriesNumber: number,
): Promise<Tournament> {
  return fetch(`${BASE}/${tournamentId}/series/${seriesNumber}/reopen`, {
    method: 'PUT',
    headers: headersFor(tournamentId),
  }).then((r) => handleResponse(r));
}

/** Passwort prüfen */
export async function verifyPassword(
  tournamentId: string,
  password: string,
): Promise<boolean> {
  const res = await fetch(`${BASE}/${tournamentId}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (res.ok) {
    setStoredPassword(tournamentId, password);
    return true;
  }
  return false;
}
