'use client';

import { use, useMemo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTournament } from '@/hooks/use-tournament';
import { useTournamentStore } from '@/store/tournament-store';

export default function MobileTablePage({
  params,
}: {
  params: Promise<{ id: string; seriesNumber: string; tableNumber: string }>;
}) {
  const {
    id,
    seriesNumber: seriesNumStr,
    tableNumber: tableNumStr,
  } = use(params);
  const seriesNumber = parseInt(seriesNumStr, 10);
  const tableNumber = parseInt(tableNumStr, 10);

  // Poll every 3 seconds for live updates (other tables filling in scores)
  const { tournament, loading, error } = useTournament(id, 3000);
  const updateScore = useTournamentStore((s) => s.updateScore);

  if (loading || !tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">🃏</div>
          <div className="animate-pulse text-gray-400 font-medium">
            Tischkarte laden…
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-sm w-full">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const series = tournament.series.find((s) => s.seriesNumber === seriesNumber);
  const table = series?.tables.find((t) => t.tableNumber === tableNumber);

  if (!series || !table) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <p className="text-gray-600">
            Tisch {tableNumber} in Serie {seriesNumber} nicht gefunden.
          </p>
          <Link
            href={`/turnier/${id}`}
            className="text-emerald-600 hover:underline mt-2 inline-block"
          >
            Zur Turnierübersicht
          </Link>
        </div>
      </div>
    );
  }

  const playerMap: Record<string, string> = {};
  for (const p of tournament.players) {
    playerMap[p.id] = p.name;
  }

  const sums: Record<string, number> = {};
  for (const pid of table.playerIds) {
    sums[pid] = table.games.reduce(
      (sum, g) => sum + (g.scores[pid] ?? 0),
      0,
    );
  }

  const completedCount = table.games.filter((g) =>
    table.playerIds.every((pid) => g.scores[pid] !== null && g.scores[pid] !== undefined),
  ).length;
  const totalGames = table.games.length;
  const percent = totalGames > 0 ? Math.round((completedCount / totalGames) * 100) : 0;

  const COLORS = [
    { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', ring: 'focus:ring-blue-400' },
    { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-800', ring: 'focus:ring-violet-400' },
    { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', ring: 'focus:ring-amber-400' },
  ];

  const handleScoreChange = (
    gameNumber: number,
    playerId: string,
    value: string,
  ) => {
    const numVal = value === '' || value === '-' ? null : parseInt(value, 10);
    if (value !== '' && value !== '-' && isNaN(numVal as number)) return;
    updateScore(seriesNumber, tableNumber, gameNumber, playerId, numVal);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-3 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-xl font-bold text-lg">
              {tableNumber}
            </div>
            <div>
              <div className="font-bold text-base leading-tight">
                Tisch {tableNumber}
              </div>
              <div className="text-xs text-emerald-200">
                Serie {seriesNumber} · {tournament.name}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-emerald-200">Fortschritt</div>
            <div className="font-bold text-lg">{percent}%</div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-2 w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              percent === 100 ? 'bg-green-300' : 'bg-white/70'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Spieler-Übersicht */}
      <div className="px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {table.playerIds.map((pid, idx) => {
            const color = COLORS[idx % 3];
            return (
              <div
                key={pid}
                className={`${color.bg} ${color.border} border rounded-xl px-3 py-2 flex-1 min-w-[90px] text-center`}
              >
                <div className={`text-xs font-semibold ${color.text} truncate`}>
                  {playerMap[pid]?.split(' ')[0] ?? '?'}
                </div>
                <div
                  className={`text-lg font-extrabold tabular-nums ${
                    sums[pid] > 0
                      ? 'text-emerald-700'
                      : sums[pid] < 0
                        ? 'text-red-600'
                        : 'text-gray-500'
                  }`}
                >
                  {sums[pid]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completed message */}
      {series.completed && (
        <div className="mx-4 mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <span className="text-emerald-700 font-medium">
            ✓ Serie abgeschlossen — Punkte sind eingefroren
          </span>
        </div>
      )}

      {/* Spiele-Eingabe */}
      <div className="px-4 pb-8 space-y-2">
        {table.games.map((game) => {
          const isComplete = table.playerIds.every(
            (pid) => game.scores[pid] !== null && game.scores[pid] !== undefined,
          );
          return (
            <div
              key={game.gameNumber}
              className={`bg-white rounded-xl border p-3 transition-all ${
                isComplete
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${
                    isComplete
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {game.gameNumber}
                </span>
                <span className="text-xs text-gray-400">
                  Spiel {game.gameNumber}
                </span>
                {isComplete && (
                  <span className="text-emerald-500 text-xs ml-auto">✓</span>
                )}
              </div>
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${table.playerIds.length}, 1fr)` }}>
                {table.playerIds.map((pid, idx) => {
                  const color = COLORS[idx % 3];
                  const val = game.scores[pid];
                  const hasValue = val !== null && val !== undefined;
                  return (
                    <div key={pid} className="text-center">
                      <label className={`text-[10px] font-medium ${color.text} block mb-1`}>
                        {playerMap[pid]?.split(' ')[0] ?? '?'}
                      </label>
                      {series.completed ? (
                        <div
                          className={`w-full px-2 py-2 text-center text-sm font-bold tabular-nums rounded-lg ${
                            hasValue && val! < 0
                              ? 'text-red-600 bg-red-50'
                              : hasValue && val! > 0
                                ? 'text-emerald-700 bg-emerald-50'
                                : 'text-gray-400 bg-gray-50'
                          }`}
                        >
                          {hasValue ? val : '–'}
                        </div>
                      ) : (
                        <input
                          type="number"
                          inputMode="numeric"
                          value={hasValue ? val! : ''}
                          onChange={(e) =>
                            handleScoreChange(game.gameNumber, pid, e.target.value)
                          }
                          className={`w-full px-2 py-2 text-center text-sm font-bold tabular-nums
                            border rounded-lg
                            focus:outline-none focus:ring-2 ${color.ring} focus:border-transparent
                            placeholder:text-gray-300
                            ${color.border}
                            ${
                              hasValue
                                ? val! < 0
                                  ? 'text-red-600 bg-red-50/50'
                                  : val! > 0
                                    ? 'text-emerald-700 bg-emerald-50/50'
                                    : 'text-gray-600'
                                : 'bg-white'
                            }`}
                          placeholder="–"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">
            {completedCount}/{totalGames} Spiele komplett
          </div>
          <Link
            href={`/turnier/${id}/serie/${seriesNumber}`}
            className="text-sm text-emerald-600 font-medium hover:underline"
          >
            Alle Tische →
          </Link>
        </div>
      </div>
    </div>
  );
}
