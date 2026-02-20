'use client';

import Link from 'next/link';
import { Tournament, Series } from '@/types';
import { getSeriesCompletionStats } from '@/lib/scoring';

interface Props {
  tournament: Tournament;
}

function playerName(tournament: Tournament, id: string): string {
  return tournament.players.find((p) => p.id === id)?.name ?? '?';
}

function SeriesCard({
  series,
  tournament,
}: {
  series: Series;
  tournament: Tournament;
}) {
  const stats = getSeriesCompletionStats(series);

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Card Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-xl font-bold text-lg shadow-sm ${
            series.completed
              ? 'bg-emerald-100 text-emerald-700'
              : stats.percentage > 0
                ? 'bg-amber-100 text-amber-700'
                : 'bg-gray-100 text-gray-500'
          }`}>
            {series.seriesNumber}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">
              Serie {series.seriesNumber}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              {series.completed ? (
                <span className="badge bg-emerald-100 text-emerald-700">
                  ✓ Abgeschlossen
                </span>
              ) : stats.percentage > 0 ? (
                <span className="badge bg-amber-100 text-amber-700">
                  {stats.percentage}% eingetragen
                </span>
              ) : (
                <span className="badge bg-gray-100 text-gray-500">
                  Offen
                </span>
              )}
            </div>
          </div>
        </div>
        <Link
          href={`/turnier/serie/${series.seriesNumber}`}
          className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
            series.completed
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700'
          }`}
        >
          {series.completed ? 'Ansehen →' : 'Ergebnisse eintragen →'}
        </Link>
      </div>

      <div className="px-5 py-4">
        {/* Tische */}
        <div className="space-y-2">
          {series.tables.map((table) => (
            <div key={table.tableNumber} className="flex items-center gap-3 py-1.5">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider w-16 shrink-0">
                Tisch {table.tableNumber}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {table.playerIds.map((pid) => (
                  <Link
                    key={pid}
                    href={`/turnier/spieler/${pid}`}
                    className="text-sm bg-emerald-50 text-emerald-800 px-3 py-1 rounded-lg font-medium hover:bg-emerald-100 transition-colors border border-emerald-100"
                  >
                    {playerName(tournament, pid)}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Aussetzer */}
        {series.byePlayerIds.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider w-16 shrink-0">
                Pause
              </span>
              <div className="flex flex-wrap gap-1.5">
                {series.byePlayerIds.map((pid) => (
                  <span
                    key={pid}
                    className="text-sm bg-amber-50 text-amber-700 px-3 py-1 rounded-lg font-medium border border-amber-100"
                  >
                    {playerName(tournament, pid)}
                    {series.completed && series.byeAverageScore !== null && (
                      <span className="ml-1.5 text-xs font-bold text-amber-600">
                        Ø {series.byeAverageScore.toFixed(1)}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SeriesPlanner({ tournament }: Props) {
  return (
    <div className="space-y-5">
      {tournament.series.map((series) => (
        <SeriesCard
          key={series.seriesNumber}
          series={series}
          tournament={tournament}
        />
      ))}
    </div>
  );
}
