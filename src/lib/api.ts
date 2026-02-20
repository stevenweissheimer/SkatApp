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
  createdAt: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

/** Alle Turniere als Liste */
export function listTournaments(): Promise<TournamentListItem[]> {
  return fetch(BASE).then((r) => handleResponse(r));
}

/** Einzelnes Turnier laden */
export function getTournament(id: string): Promise<Tournament> {
  return fetch(`${BASE}/${id}`).then((r) => handleResponse(r));
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
  data: Partial<Tournament>,
): Promise<Tournament> {
  return fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((r) => handleResponse(r));
}

/** Turnier löschen */
export function deleteTournament(id: string): Promise<void> {
  return fetch(`${BASE}/${id}`, { method: 'DELETE' }).then((r) =>
    handleResponse(r),
  );
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
    headers: { 'Content-Type': 'application/json' },
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
  }).then((r) => handleResponse(r));
}

/** Serie wieder öffnen */
export function reopenSeries(
  tournamentId: string,
  seriesNumber: number,
): Promise<Tournament> {
  return fetch(`${BASE}/${tournamentId}/series/${seriesNumber}/reopen`, {
    method: 'PUT',
  }).then((r) => handleResponse(r));
}
