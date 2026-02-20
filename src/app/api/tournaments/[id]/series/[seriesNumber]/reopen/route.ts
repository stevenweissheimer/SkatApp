import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { TournamentModel, toPlainTournament } from '@/lib/models/tournament';

type Params = {
  params: Promise<{ id: string; seriesNumber: string }>;
};

/**
 * PUT /api/tournaments/[id]/series/[seriesNumber]/reopen
 * Öffnet eine abgeschlossene Serie wieder
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

  series.completed = false;
  series.byeAverageScore = null;
  doc.markModified('series');
  await doc.save();

  return NextResponse.json(toPlainTournament(doc));
}
