import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { TournamentModel, toPlainTournament } from '@/lib/models/tournament';
import { generateAllSeriesPlans } from '@/lib/planner';
import { Player } from '@/types';
import { checkTournamentPassword } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

/** GET /api/tournaments/[id] — Einzelnes Turnier laden */
export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  await connectDB();

  const doc = await TournamentModel.findById(id);
  if (!doc) {
    return NextResponse.json({ error: 'Turnier nicht gefunden' }, { status: 404 });
  }

  // Passwort-Prüfung
  const authError = checkTournamentPassword(doc, req);
  if (authError) return authError;

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

  // Passwort-Prüfung
  const authError = checkTournamentPassword(doc, req);
  if (authError) return authError;

  // Prüfe ob strukturelle Änderungen vorliegen (erfordern Neu-Planung)
  const structuralChange =
    (body.seriesCount !== undefined && body.seriesCount !== doc.seriesCount) ||
    (body.gamesPerSeries !== undefined && body.gamesPerSeries !== doc.gamesPerSeries);

  // Strukturelle Änderungen nur erlauben wenn noch keine Punkte eingetragen
  if (structuralChange) {
    const hasScores = doc.series.some((s: any) =>
      s.tables.some((t: any) =>
        t.games.some((g: any) => {
          const scores = g.scores;
          if (scores instanceof Map) {
            return Array.from(scores.values()).some((v: any) => typeof v === 'number');
          }
          return Object.values(scores || {}).some((v) => typeof v === 'number');
        }),
      ),
    );
    if (hasScores) {
      return NextResponse.json(
        { error: 'Serien/Spiele können nicht geändert werden, da bereits Punkte eingetragen wurden.' },
        { status: 400 },
      );
    }
  }

  // Felder die immer aktualisiert werden dürfen
  const allowed = [
    'name', 'date', 'location', 'entryFee',
    'prizeRules', 'prizePreset', 'extraPrizePool',
    'houseRules', 'organizerName', 'organizerContact',
    'players', 'password',
  ];

  for (const key of allowed) {
    if (body[key] !== undefined) {
      (doc as any)[key] = body[key];
    }
  }

  // Strukturelle Felder + Neu-Planung
  if (structuralChange) {
    const newSeriesCount = body.seriesCount ?? doc.seriesCount;
    const newGamesPerSeries = body.gamesPerSeries ?? doc.gamesPerSeries;
    doc.seriesCount = newSeriesCount;
    doc.gamesPerSeries = newGamesPerSeries;

    const players: Player[] = doc.players.map((p: any) => ({
      id: p.id,
      name: p.name,
      club: p.club || '',
      note: p.note || '',
    }));

    const newSeries = generateAllSeriesPlans(players, newSeriesCount, newGamesPerSeries);

    // Scores als Maps für Mongoose konvertieren
    doc.series = newSeries.map((s) => ({
      ...s,
      tables: s.tables.map((t) => ({
        ...t,
        games: t.games.map((g) => ({
          ...g,
          scores: new Map(Object.entries(g.scores)),
        })),
      })),
    }));
  }

  await doc.save();
  return NextResponse.json(toPlainTournament(doc));
}

/** DELETE /api/tournaments/[id] — Turnier löschen */
export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;
  await connectDB();

  const doc = await TournamentModel.findById(id);
  if (!doc) {
    return NextResponse.json({ error: 'Turnier nicht gefunden' }, { status: 404 });
  }

  // Passwort-Prüfung
  const authError = checkTournamentPassword(doc, req);
  if (authError) return authError;

  await TournamentModel.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
