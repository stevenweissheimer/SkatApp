'use client';

import { TableAssignment, Player } from '@/types';
import { useTournamentStore } from '@/store/tournament-store';
import { useMemo, useState } from 'react';

interface Props {
  seriesNumber: number;
  table: TableAssignment;
  players: Player[];
  readOnly?: boolean;
}

/** Farb-Badges für die Spieler am Tisch */
const PLAYER_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-800', ring: 'ring-blue-300', headerBg: 'bg-blue-50', dot: 'bg-blue-500' },
  { bg: 'bg-violet-100', text: 'text-violet-800', ring: 'ring-violet-300', headerBg: 'bg-violet-50', dot: 'bg-violet-500' },
  { bg: 'bg-amber-100', text: 'text-amber-800', ring: 'ring-amber-300', headerBg: 'bg-amber-50', dot: 'bg-amber-500' },
];

export default function TableScoreSheet({
  seriesNumber,
  table,
  players,
  readOnly = false,
}: Props) {
  const updateScore = useTournamentStore((s) => s.updateScore);
  const [collapsed, setCollapsed] = useState(false);

  const playerMap = useMemo(() => {
    const map: Record<string, Player> = {};
    for (const p of players) map[p.id] = p;
    return map;
  }, [players]);

  const sums = useMemo(() => {
    const result: Record<string, number> = {};
    for (const pid of table.playerIds) {
      result[pid] = table.games.reduce(
        (sum, g) => sum + (g.scores[pid] ?? 0),
        0,
      );
    }
    return result;
  }, [table]);

  const completedCount = useMemo(() => {
    return table.games.filter((g) =>
      table.playerIds.every(
        (id) => g.scores[id] !== null && g.scores[id] !== undefined,
      ),
    ).length;
  }, [table]);

  const totalGames = table.games.length;
  const percent = totalGames > 0 ? Math.round((completedCount / totalGames) * 100) : 0;

  const handleScoreChange = (
    gameNumber: number,
    playerId: string,
    value: string,
  ) => {
    const numVal = value === '' || value === '-' ? null : parseInt(value, 10);
    if (value !== '' && value !== '-' && isNaN(numVal as number)) return;
    updateScore(seriesNumber, table.tableNumber, gameNumber, playerId, numVal);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden transition-shadow hover:shadow-lg">
      {/* ======== Header ======== */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white cursor-pointer group"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-xl font-bold text-lg backdrop-blur-sm">
            {table.tableNumber}
          </div>
          <div className="text-left">
            <div className="font-semibold text-base leading-tight">
              Tisch {table.tableNumber}
            </div>
            <div className="flex gap-1.5 mt-1">
              {table.playerIds.map((pid, i) => (
                <span
                  key={pid}
                  className="text-xs bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full"
                >
                  {playerMap[pid]?.name.split(' ')[0] ?? '?'}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mini progress */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  percent === 100 ? 'bg-green-300' : 'bg-white/70'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-xs text-white/80 w-8">{percent}%</span>
          </div>

          <span className={`text-white/80 transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`}>
            ▼
          </span>
        </div>
      </button>

      {/* ======== Tabelle ======== */}
      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="px-4 py-3 text-left text-gray-400 font-semibold w-14 text-xs uppercase tracking-wider">
                  Nr.
                </th>
                {table.playerIds.map((pid, idx) => {
                  const color = PLAYER_COLORS[idx % 3];
                  return (
                    <th
                      key={pid}
                      className={`px-3 py-3 text-center font-semibold min-w-[100px] ${color.headerBg}`}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${color.dot}`} />
                        <span className={`truncate max-w-[90px] text-sm ${color.text}`}>
                          {playerMap[pid]?.name ?? '?'}
                        </span>
                      </div>
                    </th>
                  );
                })}
                <th className="px-3 py-3 text-center text-gray-400 font-medium w-10 text-xs uppercase tracking-wider">
                  ✓
                </th>
              </tr>
            </thead>
            <tbody>
              {table.games.map((game) => {
                const isComplete = table.playerIds.every(
                  (id) =>
                    game.scores[id] !== null && game.scores[id] !== undefined,
                );
                const isPartial =
                  !isComplete &&
                  table.playerIds.some(
                    (id) =>
                      game.scores[id] !== null &&
                      game.scores[id] !== undefined,
                  );

                return (
                  <tr
                    key={game.gameNumber}
                    className={`score-row border-b border-gray-50 last:border-b-0 ${
                      isComplete
                        ? 'bg-emerald-50/40'
                        : isPartial
                          ? 'bg-amber-50/30'
                          : 'zebra-row'
                    }`}
                  >
                    <td className="px-4 py-2 font-mono text-xs text-gray-400 font-medium">
                      {String(game.gameNumber).padStart(2, '0')}
                    </td>
                    {table.playerIds.map((pid, idx) => {
                      const val = game.scores[pid];
                      const hasValue = val !== null && val !== undefined;
                      return (
                        <td key={pid} className="px-2 py-1.5 text-center">
                          {readOnly ? (
                            <span
                              className={`inline-block min-w-[40px] text-sm font-medium tabular-nums ${
                                hasValue && val < 0
                                  ? 'text-red-600'
                                  : hasValue && val > 0
                                    ? 'text-emerald-700'
                                    : 'text-gray-400'
                              }`}
                            >
                              {hasValue ? val : '–'}
                            </span>
                          ) : (
                            <div className="score-cell">
                              <input
                                type="number"
                                value={!hasValue ? '' : val}
                                onChange={(e) =>
                                  handleScoreChange(
                                    game.gameNumber,
                                    pid,
                                    e.target.value,
                                  )
                                }
                                className={`w-full max-w-[90px] mx-auto px-2 py-1.5 text-center 
                                  border border-gray-200 rounded-lg text-sm font-medium tabular-nums
                                  focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent
                                  hover:border-gray-300 transition-colors
                                  placeholder:text-gray-300
                                  ${
                                    hasValue
                                      ? val! < 0
                                        ? 'text-red-600 bg-red-50/50'
                                        : val! > 0
                                          ? 'text-emerald-700 bg-emerald-50/50'
                                          : 'text-gray-600 bg-gray-50/50'
                                      : 'bg-white'
                                  }`}
                                placeholder="–"
                                tabIndex={0}
                              />
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-1.5 text-center">
                      {isComplete ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-xs">✓</span>
                      ) : isPartial ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-500 text-xs">…</span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-50 text-gray-300 text-xs">○</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* ======== Summenzeile ======== */}
            <tfoot>
              <tr className="border-t-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100/60">
                <td className="px-4 py-3 font-bold text-emerald-700 text-xs uppercase tracking-wider">
                  Σ
                </td>
                {table.playerIds.map((pid) => (
                  <td
                    key={pid}
                    className="px-3 py-3 text-center"
                  >
                    <span className={`text-lg font-bold tabular-nums ${
                      sums[pid] < 0
                        ? 'text-red-600'
                        : sums[pid] > 0
                          ? 'text-emerald-700'
                          : 'text-gray-500'
                    }`}>
                      {sums[pid]}
                    </span>
                  </td>
                ))}
                <td className="px-3 py-3 text-center text-xs text-gray-400">
                  {completedCount}/{totalGames}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
