'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTournamentStore } from '@/store/tournament-store';
import { isSeriesComplete, getSeriesCompletionStats } from '@/lib/scoring';
import TableScoreSheet from '@/components/TableScoreSheet';
import SeriesTimer from '@/components/SeriesTimer';
import PrintTableCards from '@/components/PrintTableCards';

export default function SeriesScorePage({
  params,
}: {
  params: Promise<{ seriesIndex: string }>;
}) {
  const { seriesIndex: seriesIndexStr } = use(params);
  const seriesNumber = parseInt(seriesIndexStr, 10);

  const [mounted, setMounted] = useState(false);
  const tournament = useTournamentStore((s) => s.tournament);
  const completeSeries = useTournamentStore((s) => s.completeSeries);
  const reopenSeries = useTournamentStore((s) => s.reopenSeries);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-400">Laden…</div>
      </div>
    );
  }

  if (!tournament?.planGenerated) {
    router.push('/');
    return null;
  }

  const series = tournament.series.find(
    (s) => s.seriesNumber === seriesNumber,
  );

  if (!series) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <div className="bg-red-50 text-red-700 p-4 rounded-2xl">
          Serie {seriesNumber} nicht gefunden.
        </div>
        <Link href="/turnier" className="text-emerald-600 hover:underline mt-4 inline-block">
          ← Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  const complete = isSeriesComplete(series);
  const stats = getSeriesCompletionStats(series);

  const handleComplete = () => {
    if (
      confirm(
        'Serie abschließen?\nDer Aussetzer-Durchschnitt wird berechnet und den Aussetzern gutgeschrieben.',
      )
    ) {
      completeSeries(seriesNumber);
    }
  };

  const handleReopen = () => {
    if (confirm('Serie wieder öffnen? Der Aussetzer-Durchschnitt wird zurückgesetzt.')) {
      reopenSeries(seriesNumber);
    }
  };

  const playerName = (id: string) =>
    tournament.players.find((p) => p.id === id)?.name ?? '?';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* ====== Header ====== */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <Link
              href="/turnier"
              className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Übersicht
            </Link>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-2 flex items-center gap-3">
              Serie {seriesNumber}
              {series.completed && (
                <span className="badge bg-emerald-100 text-emerald-700 text-sm font-semibold">
                  ✓ Abgeschlossen
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {series.tables.length} Tische · {tournament.gamesPerSeries} Spiele · {series.tables.length * 3} aktive Spieler
            </p>
          </div>

          {/* Progress Card */}
          <div className="bg-gray-50 rounded-xl p-4 min-w-[200px]">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fortschritt</span>
              <span className={`text-2xl font-extrabold tabular-nums ${
                stats.percentage === 100 ? 'text-emerald-600' : stats.percentage > 0 ? 'text-amber-600' : 'text-gray-400'
              }`}>
                {stats.percentage}%
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  stats.percentage === 100
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 progress-glow'
                    : stats.percentage > 0
                      ? 'bg-gradient-to-r from-amber-300 to-amber-400'
                      : 'bg-gray-300'
                }`}
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1.5">
              {stats.completedGames} von {stats.totalGames} Spielen eingetragen
            </div>
          </div>
        </div>

        {/* Timer + Print Row */}
        {!series.completed && (
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
            <div className="flex-1">
              <SeriesTimer defaultMinutes={90} />
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
          <PrintTableCards tournament={tournament} series={series} />
        </div>
      </div>

      {/* ====== Aussetzer-Info ====== */}
      {series.byePlayerIds.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/70 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⏸️</span>
            <h3 className="font-bold text-amber-800">
              Aussetzer in dieser Serie
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {series.byePlayerIds.map((pid) => (
              <span
                key={pid}
                className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm text-amber-800 px-4 py-2 rounded-xl text-sm font-medium shadow-sm border border-amber-200/50"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                {playerName(pid)}
                {series.completed && series.byeAverageScore !== null && (
                  <span className="ml-1 font-bold text-amber-600">
                    → {series.byeAverageScore.toFixed(1)} Pkt
                  </span>
                )}
              </span>
            ))}
          </div>
          {!series.completed && (
            <p className="text-xs text-amber-600/80 mt-3 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Aussetzer erhalten nach Abschluss der Serie den Ø aller aktiven Spieler-Summen.
            </p>
          )}
        </div>
      )}

      {/* ====== Tisch-Score-Sheets ====== */}
      <div className="space-y-6">
        {series.tables.map((table) => (
          <TableScoreSheet
            key={table.tableNumber}
            seriesNumber={seriesNumber}
            table={table}
            players={tournament.players}
            readOnly={series.completed}
          />
        ))}
      </div>

      {/* ====== Aktions-Buttons ====== */}
      <div className="flex flex-col items-center gap-4 pt-2 pb-8">
        {!series.completed && (
          <button
            onClick={handleComplete}
            disabled={!complete}
            className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200 shadow-lg ${
              complete
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
            }`}
            title={
              !complete
                ? 'Alle Spiele müssen vollständig eingetragen sein.'
                : ''
            }
          >
            ✓ Serie abschließen
          </button>
        )}

        {series.completed && (
          <button
            onClick={handleReopen}
            className="px-8 py-4 bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-2xl font-bold text-lg hover:from-amber-500 hover:to-amber-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            🔓 Serie wieder öffnen
          </button>
        )}

        {/* Nicht vollständig? Hinweis */}
        {!series.completed && !complete && stats.percentage > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 text-sm text-amber-700 max-w-lg text-center">
            ⚠ Noch {stats.totalGames - stats.completedGames} Spiele unvollständig – Serie kann erst danach abgeschlossen werden.
          </div>
        )}
      </div>
    </div>
  );
}
