import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { TournamentModel, toPlainTournament } from '@/lib/models/tournament';
import { generateAllSeriesPlans } from '@/lib/planner';
import { getDefaultPrizeRules } from '@/lib/prizes';

/** GET /api/tournaments — Liste aller Turniere (nur Meta-Daten) */
export async function GET() {
  await connectDB();
  const docs = await TournamentModel.find()
    .select('name date location players seriesCount gamesPerSeries entryFee createdAt planGenerated')
    .sort({ createdAt: -1 })
    .lean();

  const tournaments = docs.map((d: any) => ({
    id: d._id.toString(),
    name: d.name,
    date: d.date,
    location: d.location,
    playerCount: d.players?.length ?? 0,
    seriesCount: d.seriesCount,
    gamesPerSeries: d.gamesPerSeries,
    entryFee: d.entryFee,
    createdAt: d.createdAt?.toISOString?.() ?? '',
  }));

  return NextResponse.json(tournaments);
}

/** POST /api/tournaments — Neues Turnier anlegen (mit Plan-Generierung) */
export async function POST(request: Request) {
  await connectDB();

  const body = await request.json();
  const {
    name,
    date,
    location = '',
    seriesCount,
    gamesPerSeries,
    entryFee = 0,
    players,
    prizePreset = 'top3',
    prizeRules,
    extraPrizePool = 0,
    houseRules = '',
    organizerName = '',
    organizerContact = '',
  } = body;

  if (!name || !date || !seriesCount || !gamesPerSeries || !players?.length) {
    return NextResponse.json(
      { error: 'Pflichtfelder: name, date, seriesCount, gamesPerSeries, players' },
      { status: 400 },
    );
  }

  if (players.length < 3) {
    return NextResponse.json(
      { error: 'Mindestens 3 Spieler benötigt' },
      { status: 400 },
    );
  }

  // Generate series plans
  const series = generateAllSeriesPlans(players, seriesCount, gamesPerSeries);

  // Convert scores Record → Map for Mongoose
  const seriesForDB = series.map((s) => ({
    ...s,
    tables: s.tables.map((t) => ({
      ...t,
      games: t.games.map((g) => ({
        gameNumber: g.gameNumber,
        scores: new Map(Object.entries(g.scores)),
      })),
    })),
  }));

  const doc = await TournamentModel.create({
    name,
    date,
    location,
    seriesCount,
    gamesPerSeries,
    entryFee,
    players,
    series: seriesForDB,
    planGenerated: true,
    prizeRules: prizeRules ?? getDefaultPrizeRules(prizePreset),
    prizePreset,
    extraPrizePool,
    houseRules,
    organizerName,
    organizerContact,
  });

  return NextResponse.json(toPlainTournament(doc), { status: 201 });
}
