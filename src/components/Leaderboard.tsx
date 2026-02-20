'use client';

import Link from 'next/link';
import { Tournament, LeaderboardEntry } from '@/types';
import { getLeaderboard } from '@/lib/scoring';
import { getPrizeForEntry, getTotalPrizePool } from '@/lib/prizes';
import { useMemo } from 'react';

interface Props {
  tournament: Tournament;
}

const RANK_STYLES: Record<number, string> = {
  1: 'bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-l-amber-400',
  2: 'bg-gradient-to-r from-gray-50 to-slate-50 border-l-4 border-l-gray-400',
  3: 'bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-l-amber-600',
};

export default function Leaderboard({ tournament }: Props) {
  const entries = useMemo(() => getLeaderboard(tournament), [tournament]);
  const totalPool = useMemo(() => getTotalPrizePool(tournament), [tournament]);
  const showPrizes = totalPool > 0;

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-12 text-center">
        <span className="text-4xl block mb-3">📊</span>
        <p className="text-gray-500 font-medium">Noch keine Ergebnisse vorhanden.</p>
        <p className="text-sm text-gray-400 mt-1">Trage Ergebnisse in einer Serie ein, um die Rangliste zu sehen.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-100 bg-gray-50/80">
              <th className="px-4 py-4 text-left font-semibold text-gray-400 text-xs uppercase tracking-wider w-14">
                #
              </th>
              <th className="px-4 py-4 text-left font-semibold text-gray-400 text-xs uppercase tracking-wider">
                Spieler
              </th>
              {tournament.series.map((s) => (
                <th
                  key={s.seriesNumber}
                  className="px-4 py-4 text-center font-semibold text-gray-400 text-xs uppercase tracking-wider min-w-[90px]"
                >
                  Serie {s.seriesNumber}
                </th>
              ))}
              <th className="px-5 py-4 text-center font-bold text-gray-600 text-xs uppercase tracking-wider min-w-[90px]">
                Gesamt
              </th>
              {showPrizes && (
                <th className="px-4 py-4 text-center font-semibold text-amber-600 text-xs uppercase tracking-wider min-w-[90px]">
                  💰 Preis
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry: LeaderboardEntry) => (
              <tr
                key={entry.player.id}
                className={`border-b border-gray-50 last:border-b-0 hover:bg-emerald-50/30 transition-colors ${
                  RANK_STYLES[entry.rank] || ''
                }`}
              >
                <td className="px-4 py-3">
                  {entry.rank === 1 ? (
                    <span className="text-xl">🥇</span>
                  ) : entry.rank === 2 ? (
                    <span className="text-xl">🥈</span>
                  ) : entry.rank === 3 ? (
                    <span className="text-xl">🥉</span>
                  ) : (
                    <span className="text-gray-400 font-bold text-sm pl-1">{entry.rank}.</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/turnier/spieler/${entry.player.id}`}
                    className="font-semibold text-emerald-700 hover:text-emerald-900 hover:underline transition-colors"
                  >
                    {entry.player.name}
                  </Link>
                  {entry.player.club && (
                    <span className="text-xs text-gray-400 ml-2 hidden sm:inline">
                      {entry.player.club}
                    </span>
                  )}
                </td>
                {entry.seriesResults.map((sr) => {
                  const isActive = tournament.series[sr.seriesNumber - 1]?.completed || sr.total !== 0;
                  return (
                    <td key={sr.seriesNumber} className="px-4 py-3 text-center">
                      {!isActive ? (
                        <span className="text-gray-300">–</span>
                      ) : (
                        <span className="flex items-center justify-center gap-1">
                          <span
                            className={`font-medium tabular-nums ${
                              sr.total < 0
                                ? 'text-red-600'
                                : sr.total > 0
                                  ? 'text-emerald-700'
                                  : 'text-gray-500'
                            }`}
                          >
                            {sr.total}
                          </span>
                          {sr.isBye && (
                            <span
                              className="text-[10px] font-bold text-amber-500 bg-amber-50 px-1 rounded"
                              title="Aussetzer – erhält Seriendurchschnitt"
                            >
                              Ø
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="px-5 py-3 text-center">
                  <span
                    className={`text-lg font-extrabold tabular-nums ${
                      entry.grandTotal < 0
                        ? 'text-red-600'
                        : entry.grandTotal > 0
                          ? 'text-emerald-700'
                          : 'text-gray-500'
                    }`}
                  >
                    {entry.grandTotal}
                  </span>
                </td>
                {showPrizes && (
                  <td className="px-4 py-3 text-center">
                    {(() => {
                      const prize = getPrizeForEntry(tournament, entry);
                      return prize > 0 ? (
                        <span className="font-bold text-amber-600 tabular-nums">
                          {prize.toFixed(2)} €
                        </span>
                      ) : (
                        <span className="text-gray-300">–</span>
                      );
                    })()}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
