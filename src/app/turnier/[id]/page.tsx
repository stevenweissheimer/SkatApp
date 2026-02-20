'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTournament } from '@/hooks/use-tournament';
import SeriesPlanner from '@/components/SeriesPlanner';
import FairnessDisplay from '@/components/FairnessDisplay';
import { calculateFairnessReport, getLeaderboard } from '@/lib/scoring';
import { getTotalPrizePool } from '@/lib/prizes';
import { useMemo, use } from 'react';

export default function TournamentOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { tournament, loading, error } = useTournament(id, 10000);

  if (loading || !tournament) {
    return (
      <div className="max-w-6xl mx-auto p-4 pt-8">
        <div className="animate-pulse text-center py-20 text-gray-400 text-lg">
          Turnier laden…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4 pt-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <Link href="/" className="text-emerald-600 hover:underline mt-2 inline-block">
            ← Zur Turnierauswahl
          </Link>
        </div>
      </div>
    );
  }

  const fairnessReport = calculateFairnessReport(tournament);
  const entries = getLeaderboard(tournament);
  const totalPool = getTotalPrizePool(tournament);

  const dateStr = new Date(tournament.date + 'T00:00:00').toLocaleDateString(
    'de-DE',
    { day: '2-digit', month: 'long', year: 'numeric' },
  );

  const completedSeries = tournament.series.filter((s) => s.completed).length;
  const totalSeries = tournament.series.length;

  return (
    <div className="max-w-6xl mx-auto p-4 pt-6 space-y-6">
      {/* Turnier-Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/"
              className="text-emerald-200 text-sm hover:text-white transition-colors mb-2 inline-flex items-center gap-1"
            >
              ← Alle Turniere
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold">{tournament.name}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-emerald-100 text-sm">
              <span>📅 {dateStr}</span>
              {tournament.location && <span>📍 {tournament.location}</span>}
              <span>👥 {tournament.players.length} Spieler</span>
              <span>
                🎯 {tournament.seriesCount} Serien × {tournament.gamesPerSeries} Spiele
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="text-right">
              <div className="text-xs text-emerald-200 uppercase tracking-wider font-semibold">
                Fortschritt
              </div>
              <div className="text-2xl font-extrabold">
                {completedSeries}/{totalSeries}
              </div>
            </div>
            {totalPool > 0 && (
              <div className="text-right">
                <div className="text-xs text-emerald-200 uppercase tracking-wider font-semibold">
                  Preispool
                </div>
                <div className="text-lg font-bold">{totalPool.toFixed(2)} €</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schnell-Aktionen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href={`/turnier/${id}/rangliste`}
          className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md hover:border-emerald-200 transition-all text-center group"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform inline-block">🏆</span>
          <div className="text-sm font-semibold text-gray-700 mt-1">Rangliste</div>
        </Link>
        <Link
          href={`/turnier/${id}/einstellungen`}
          className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md hover:border-emerald-200 transition-all text-center group"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform inline-block">⚙️</span>
          <div className="text-sm font-semibold text-gray-700 mt-1">Einstellungen</div>
        </Link>
        <Link
          href={`/turnier/${id}/export`}
          className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md hover:border-emerald-200 transition-all text-center group"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform inline-block">💾</span>
          <div className="text-sm font-semibold text-gray-700 mt-1">Export</div>
        </Link>
        <Link
          href="/"
          className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md hover:border-emerald-200 transition-all text-center group"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform inline-block">📋</span>
          <div className="text-sm font-semibold text-gray-700 mt-1">Alle Turniere</div>
        </Link>
      </div>

      {/* Top 3 Kurzansicht */}
      {entries.length > 0 && (
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <span>🏆</span> Aktuelle Top-Spieler
            </h2>
            <Link
              href={`/turnier/${id}/rangliste`}
              className="text-sm text-emerald-600 hover:underline"
            >
              Volle Rangliste →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {entries.slice(0, 3).map((entry) => (
              <div
                key={entry.player.id}
                className="flex items-center gap-3 bg-gray-50 rounded-xl p-3"
              >
                <span className="text-2xl">
                  {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                </span>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/turnier/${id}/spieler/${entry.player.id}`}
                    className="font-semibold text-gray-800 hover:text-emerald-700 truncate block"
                  >
                    {entry.player.name}
                  </Link>
                  {entry.player.club && (
                    <span className="text-xs text-gray-400">{entry.player.club}</span>
                  )}
                </div>
                <span
                  className={`text-lg font-extrabold tabular-nums ${
                    entry.grandTotal > 0
                      ? 'text-emerald-700'
                      : entry.grandTotal < 0
                        ? 'text-red-600'
                        : 'text-gray-500'
                  }`}
                >
                  {entry.grandTotal}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fairness */}
      <FairnessDisplay report={fairnessReport} />

      {/* Serien-Planung */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>📋</span> Serien-Übersicht
        </h2>
        <SeriesPlanner tournament={tournament} tournamentId={id} />
      </div>
    </div>
  );
}
