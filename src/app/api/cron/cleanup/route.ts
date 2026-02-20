import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { TournamentModel } from '@/lib/models/tournament';

/**
 * GET /api/cron/cleanup
 *
 * Löscht Turniere die älter als X Tage sind.
 * Aufbewahrungsdauer über CLEANUP_DAYS env var konfigurierbar (Standard: 30).
 * Kann per Cron-Job aufgerufen werden (z.B. Railway Cron, Vercel Cron, etc.)
 *
 * Optional: Header "x-cron-secret" zur Absicherung (CRON_SECRET env var).
 */
export async function GET(req: Request) {
  // Optionale Absicherung über Shared Secret
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const provided = req.headers.get('x-cron-secret') || '';
    if (provided !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  await connectDB();

  const retentionDays = Math.max(1, parseInt(process.env.CLEANUP_DAYS || '30', 10) || 30);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);

  const result = await TournamentModel.deleteMany({
    createdAt: { $lt: cutoff },
  });

  console.log(`🧹 Cleanup: ${result.deletedCount} Turnier(e) älter als ${retentionDays} Tage gelöscht.`);

  return NextResponse.json({
    ok: true,
    deleted: result.deletedCount,
    retentionDays,
    olderThan: cutoff.toISOString(),
  });
}
