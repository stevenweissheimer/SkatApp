'use client';

import Link from 'next/link';
import { useTournament } from '@/hooks/use-tournament';
import { useTournamentStore } from '@/store/tournament-store';
import TableScoreSheet from '@/components/TableScoreSheet';
import SeriesTimer from '@/components/SeriesTimer';
import PrintTableCards from '@/components/PrintTableCards';
import { use, useMemo, useState } from 'react';
import { getSeriesCompletionStats } from '@/lib/scoring';

export default function SeriesPage({
  params,
}: {
  params: Promise<{ id: string; seriesNumber: string }>;
}) {
  const { id, seriesNumber: seriesNumStr } = use(params);
  const seriesNumber = parseInt(seriesNumStr, 10);
  const { tournament, loading, error } = useTournament(id, 5000);
  const completeSeries = useTournamentStore((s) => s.completeSeries);
  const reopenSeries = useTournamentStore((s) => s.reopenSeries);
  const [busy, setBusy] = useState(false);

  if (loading || !tournament) {
    return (
      <div className="max-w-6xl mx-auto p-4 pt-8">
        <div className="animate-pulse text-center py-20 text-gray-400 text-lg">
          Serie laden…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4 pt-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const series = tournament.series.find((s) => s.seriesNumber === seriesNumber);

  if (!series) {
    return (
      <div className="max-w-6xl mx-auto p-4 pt-8 text-center">
        <p className="text-gray-600">Serie {seriesNumber} nicht gefunden.</p>
        <Link
          href={`/turnier/${id}`}
          className="text-emerald-600 hover:underline mt-2 inline-block"
        >
          ← Zur Übersicht
        </Link>
      </div>
    );
  }

  const stats = getSeriesCompletionStats(series);
  const isComplete = stats.percentage === 100;

  const handleComplete = async () => {
    if (
      !confirm(
        'Serie abschließen?\nAussetzer erhalten den Seriendurchschnitt. Punkte können danach nicht mehr geändert werden.',
      )
    )
      return;
    setBusy(true);
    await completeSeries(seriesNumber);
    setBusy(false);
  };

  const handleReopen = async () => {
    if (!confirm('Serie wieder öffnen?\nDer Aussetzer-Durchschnitt wird zurückgesetzt.'))
      return;
    setBusy(true);
    await reopenSeries(seriesNumber);
    setBusy(false);
  };

  // Generate QR-Sharing URL base
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="max-w-6xl mx-auto p-4 pt-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href={`/turnier/${id}`}
            className="text-emerald-600 text-sm hover:underline mb-1 inline-flex items-center gap-1"
          >
            ← Übersicht
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-3">
            <span className="text-3xl">📝</span>
            Serie {seriesNumber}
            {series.completed && (
              <span className="text-sm font-medium bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                ✓ Abgeschlossen
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {series.tables.length} Tische · {tournament.gamesPerSeries} Spiele ·{' '}
            {stats.percentage}% eingetragen
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <PrintTableCards tournament={tournament} series={series} />
          {!series.completed && isComplete && (
            <button
              onClick={handleComplete}
              disabled={busy}
              className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-bold hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-sm disabled:opacity-50"
            >
              {busy ? 'Wird abgeschlossen…' : '✓ Serie abschließen'}
            </button>
          )}
          {series.completed && (
            <button
              onClick={handleReopen}
              disabled={busy}
              className="px-5 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              {busy ? 'Wird geöffnet…' : '↻ Wieder öffnen'}
            </button>
          )}
        </div>
      </div>

      {/* Timer */}
      {!series.completed && <SeriesTimer />}

      {/* Aussetzer */}
      {series.byePlayerIds.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <span className="font-semibold text-amber-800">Aussetzer:</span>{' '}
          {series.byePlayerIds
            .map(
              (pid) =>
                tournament.players.find((p) => p.id === pid)?.name ?? '?',
            )
            .join(', ')}
          {series.completed && series.byeAverageScore !== null && (
            <span className="ml-2 text-amber-600 font-medium">
              (Ø {series.byeAverageScore.toFixed(1)} Punkte)
            </span>
          )}
        </div>
      )}

      {/* Handy-Links (Tischkarten auf dem Handy) */}
      {!series.completed && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
            📱 Tisch-Links für Handy-Eingabe
          </h3>
          <p className="text-sm text-blue-600 mb-3">
            Teile diese Links mit den Spielern an jedem Tisch, um Ergebnisse direkt auf dem Handy einzutragen.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {series.tables.map((table) => {
              const tokenParam = tournament.scoreToken ? `?token=${tournament.scoreToken}` : '';
              const url = `${baseUrl}/turnier/${id}/serie/${seriesNumber}/tisch/${table.tableNumber}${tokenParam}`;
              return (
                <button
                  key={table.tableNumber}
                  onClick={() => {
                    navigator.clipboard?.writeText(url);
                    alert(`Link für Tisch ${table.tableNumber} kopiert!`);
                  }}
                  className="bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-2"
                >
                  <span className="font-bold">T{table.tableNumber}</span>
                  <span className="text-blue-400">📋 Kopieren</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tisch-Score-Sheets */}
      <div className="space-y-4">
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

      {/* Navigation zwischen Serien */}
      <div className="flex items-center justify-between pt-4">
        {seriesNumber > 1 ? (
          <Link
            href={`/turnier/${id}/serie/${seriesNumber - 1}`}
            className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            ← Serie {seriesNumber - 1}
          </Link>
        ) : (
          <span />
        )}
        {seriesNumber < tournament.seriesCount && (
          <Link
            href={`/turnier/${id}/serie/${seriesNumber + 1}`}
            className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Serie {seriesNumber + 1} →
          </Link>
        )}
      </div>
    </div>
  );
}
