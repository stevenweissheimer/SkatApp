import { NextResponse } from 'next/server';
import { TournamentDocument } from '@/lib/models/tournament';

/**
 * Prüft ob das Turnier-Passwort oder ein gültiger Score-Token vorhanden ist.
 * Gibt eine 401-Response zurück wenn beides fehlt/falsch ist,
 * oder null wenn alles OK ist (kein Passwort gesetzt ODER korrekt ODER Token gültig).
 */
export function checkTournamentPassword(
  doc: TournamentDocument,
  req: Request,
): NextResponse | null {
  // Kein Passwort → immer erlaubt
  if (!doc.password) return null;

  // Passwort-Header prüfen
  const provided = req.headers.get('x-tournament-password') || '';
  if (provided === doc.password) return null;

  // Score-Token prüfen (für QR-Code-Zugang)
  const token = req.headers.get('x-score-token') || '';
  if (doc.scoreToken && token === doc.scoreToken) return null;

  return NextResponse.json(
    { error: 'password-required', hasPassword: true },
    { status: 401 },
  );
}
