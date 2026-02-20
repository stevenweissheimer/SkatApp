import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { TournamentModel } from '@/lib/models/tournament';

type Params = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/tournaments/[id]/verify
 * Body: { password: string }
 *
 * Prüft ob das Passwort korrekt ist.
 * Gibt { ok: true } oder 401 zurück.
 */
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  await connectDB();

  const doc = await TournamentModel.findById(id).select('password');
  if (!doc) {
    return NextResponse.json({ error: 'Turnier nicht gefunden' }, { status: 404 });
  }

  if (!doc.password) {
    // Kein Passwort gesetzt → immer OK
    return NextResponse.json({ ok: true });
  }

  const { password } = await req.json();
  if (password === doc.password) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    { error: 'Falsches Passwort', ok: false },
    { status: 401 },
  );
}
