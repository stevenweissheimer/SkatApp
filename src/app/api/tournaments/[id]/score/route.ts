import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { TournamentModel, toPlainTournament } from '@/lib/models/tournament';
import { checkTournamentPassword } from '@/lib/auth';

type Params = {
  params: Promise<{ id: string }>;
};

/**
 * PUT /api/tournaments/[id]/score
 *
 * Body: { seriesNumber, tableNumber, gameNumber, playerId, score }
 *
 * Updates a single score value. This is the core endpoint for mobile table input.
 */
export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  await connectDB();

  const body = await req.json();
  const { seriesNumber, tableNumber, gameNumber, playerId, score } = body;

  if (
    seriesNumber == null ||
    tableNumber == null ||
    gameNumber == null ||
    !playerId
  ) {
    return NextResponse.json(
      { error: 'seriesNumber, tableNumber, gameNumber, playerId required' },
      { status: 400 },
    );
  }

  const doc = await TournamentModel.findById(id);
  if (!doc) {
    return NextResponse.json(
      { error: 'Turnier nicht gefunden' },
      { status: 404 },
    );
  }

  // Passwort-Prüfung
  const authError = checkTournamentPassword(doc, req);
  if (authError) return authError;

  // Find series, table, game
  const series = doc.series.find((s) => s.seriesNumber === seriesNumber);
  if (!series) {
    return NextResponse.json(
      { error: `Serie ${seriesNumber} nicht gefunden` },
      { status: 404 },
    );
  }
  if (series.completed) {
    return NextResponse.json(
      { error: 'Serie ist bereits abgeschlossen' },
      { status: 400 },
    );
  }

  const table = series.tables.find((t) => t.tableNumber === tableNumber);
  if (!table) {
    return NextResponse.json(
      { error: `Tisch ${tableNumber} nicht gefunden` },
      { status: 404 },
    );
  }

  const game = table.games.find((g) => g.gameNumber === gameNumber);
  if (!game) {
    return NextResponse.json(
      { error: `Spiel ${gameNumber} nicht gefunden` },
      { status: 404 },
    );
  }

  // Update score
  game.scores.set(playerId, score ?? null);
  doc.markModified('series');
  await doc.save();

  return NextResponse.json({ ok: true, score });
}
