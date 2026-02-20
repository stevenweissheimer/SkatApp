import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { TournamentModel, toPlainTournament } from '@/lib/models/tournament';
import { calculateByeAverage } from '@/lib/scoring';

type Params = {
  params: Promise<{ id: string; seriesNumber: string }>;
};

/**
 * PUT /api/tournaments/[id]/series/[seriesNumber]/complete
 * Schließt eine Serie ab (berechnet Aussetzer-Durchschnitt)
 */
export async function PUT(_req: Request, { params }: Params) {
  const { id, seriesNumber: snStr } = await params;
  const seriesNumber = parseInt(snStr, 10);

  await connectDB();
  const doc = await TournamentModel.findById(id);
  if (!doc) {
    return NextResponse.json({ error: 'Turnier nicht gefunden' }, { status: 404 });
  }

  const series = doc.series.find((s) => s.seriesNumber === seriesNumber);
  if (!series) {
    return NextResponse.json({ error: `Serie ${seriesNumber} nicht gefunden` }, { status: 404 });
  }

  // Convert to plain for scoring calc
  const plain = toPlainTournament(doc);
  const plainSeries = plain.series.find((s) => s.seriesNumber === seriesNumber)!;

  const byeAvg = calculateByeAverage(plainSeries, plain.players);

  series.completed = true;
  series.byeAverageScore = byeAvg;
  doc.markModified('series');
  await doc.save();

  return NextResponse.json(toPlainTournament(doc));
}
