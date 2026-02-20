import { NextResponse } from 'next/server';
import { TournamentDocument } from '@/lib/models/tournament';

/**
 * Prüft ob das Turnier-Passwort korrekt ist.
 * Gibt eine 401-Response zurück wenn das Passwort falsch/fehlt,
 * oder null wenn alles OK ist (kein Passwort gesetzt ODER korrekt).
 */
export function checkTournamentPassword(
  doc: TournamentDocument,
  req: Request,
): NextResponse | null {
  // Kein Passwort → immer erlaubt
  if (!doc.password) return null;

  const provided = req.headers.get('x-tournament-password') || '';
  if (provided === doc.password) return null;

  return NextResponse.json(
    { error: 'password-required', hasPassword: true },
    { status: 401 },
  );
}
