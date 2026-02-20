import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { TournamentModel, toPlainTournament } from '@/lib/models/tournament';

type Params = { params: Promise<{ id: string }> };

/** GET /api/tournaments/[id] — Einzelnes Turnier laden */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  await connectDB();

  const doc = await TournamentModel.findById(id);
  if (!doc) {
    return NextResponse.json({ error: 'Turnier nicht gefunden' }, { status: 404 });
  }

  return NextResponse.json(toPlainTournament(doc));
}

/** PUT /api/tournaments/[id] — Turnier-Einstellungen aktualisieren */
export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  await connectDB();

  const body = await req.json();
  const doc = await TournamentModel.findById(id);
  if (!doc) {
    return NextResponse.json({ error: 'Turnier nicht gefunden' }, { status: 404 });
  }

  // Felder die immer aktualisiert werden dürfen
  const allowed = [
    'name', 'date', 'location', 'entryFee',
    'prizeRules', 'prizePreset', 'extraPrizePool',
    'houseRules', 'organizerName', 'organizerContact',
  ];

  for (const key of allowed) {
    if (body[key] !== undefined) {
      (doc as any)[key] = body[key];
    }
  }

  await doc.save();
  return NextResponse.json(toPlainTournament(doc));
}

/** DELETE /api/tournaments/[id] — Turnier löschen */
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  await connectDB();

  const result = await TournamentModel.findByIdAndDelete(id);
  if (!result) {
    return NextResponse.json({ error: 'Turnier nicht gefunden' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
