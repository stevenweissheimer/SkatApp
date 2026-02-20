'use client';

import Link from 'next/link';
import { Tournament, Player } from '@/types';
import { useMemo } from 'react';

interface Props {
  tournament: Tournament;
  player: Player;
}

interface CoPlayerInfo {
  id: string;
  name: string;
  count: number;
}

export default function PlayerDetail({ tournament, player }: Props) {
  const stats = useMemo(() => {
    const seriesData = tournament.series.map((series) => {
      const isBye = series.byePlayerIds.includes(player.id);
      const table = series.tables.find((t) =>
        t.playerIds.includes(player.id),
      );
      const tableNumber = table?.tableNumber ?? null;
      const coPlayerIds = table
        ? table.playerIds.filter((id) => id !== player.id)
        : [];

      let total = 0;
      if (isBye) {
        total = series.byeAverageScore ?? 0;
      } else if (table) {
        total = table.games.reduce(
          (sum, g) => sum + (g.scores[player.id] ?? 0),
          0,
        );
      }

      return {
        seriesNumber: series.seriesNumber,
        isBye,
        tableNumber,
        total,
        coPlayerIds,
        completed: series.completed,
      };
    });

    const grandTotal = seriesData.reduce((sum, s) => sum + s.total, 0);
    const byeCount = seriesData.filter((s) => s.isBye).length;

    // Einzelspiel-Statistiken (alle Spiele über alle Serien)
    let gamesPlayed = 0;
    let gamesWon = 0; // positive score
    let gamesLost = 0; // negative score
    let gamesZero = 0; // zero score
    let bestSingleGame = -Infinity;
    let worstSingleGame = Infinity;
    let totalGamePoints = 0;

    for (const series of tournament.series) {
      if (series.byePlayerIds.includes(player.id)) continue;
      const table = series.tables.find((t) => t.playerIds.includes(player.id));
      if (!table) continue;
      for (const game of table.games) {
        const score = game.scores[player.id];
        if (score === null || score === undefined) continue;
        gamesPlayed++;
        totalGamePoints += score;
        if (score > 0) gamesWon++;
        else if (score < 0) gamesLost++;
        else gamesZero++;
        if (score > bestSingleGame) bestSingleGame = score;
        if (score < worstSingleGame) worstSingleGame = score;
      }
    }

    const avgPerGame = gamesPlayed > 0 ? totalGamePoints / gamesPlayed : 0;
    const winRate = gamesPlayed > 0 ? (gamesWon / gamesPlayed) * 100 : 0;
    if (bestSingleGame === -Infinity) bestSingleGame = 0;
    if (worstSingleGame === Infinity) worstSingleGame = 0;

    const gameStats = {
      gamesPlayed,
      gamesWon,
      gamesLost,
      gamesZero,
      bestSingleGame,
      worstSingleGame,
      avgPerGame,
      winRate,
    };

    // Co-Player Statistik
    const coPlayerCounts: Record<string, number> = {};
    for (const sd of seriesData) {
      for (const cpId of sd.coPlayerIds) {
        coPlayerCounts[cpId] = (coPlayerCounts[cpId] || 0) + 1;
      }
    }

    const coPlayers: CoPlayerInfo[] = Object.entries(coPlayerCounts)
      .map(([id, count]) => ({
        id,
        name: tournament.players.find((p) => p.id === id)?.name ?? '?',
        count,
      }))
      .sort((a, b) => b.count - a.count);

    return { seriesData, grandTotal, byeCount, coPlayers, gameStats };
  }, [tournament, player]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{player.name}</h1>
            {player.club && (
              <p className="text-gray-500 mt-1">{player.club}</p>
            )}
            {player.note && (
              <p className="text-gray-400 text-sm mt-1">{player.note}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-emerald-700">
              {stats.grandTotal}
            </div>
            <div className="text-sm text-gray-500">Gesamtpunkte</div>
          </div>
        </div>
      </div>

      {/* Spielstatistiken */}
      {stats.gameStats.gamesPlayed > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <span>📊</span> Spielstatistiken
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-emerald-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-emerald-700">{stats.gameStats.winRate.toFixed(0)}%</div>
              <div className="text-xs text-emerald-600">Gewinnquote</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-700">{stats.gameStats.avgPerGame.toFixed(1)}</div>
              <div className="text-xs text-blue-600">Ø pro Spiel</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-amber-700">{stats.gameStats.bestSingleGame}</div>
              <div className="text-xs text-amber-600">Bestes Spiel</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.gameStats.worstSingleGame}</div>
              <div className="text-xs text-red-500">Schlechtestes</div>
            </div>
          </div>
          <div className="mt-3 flex gap-4 text-sm text-gray-600">
            <span>🎮 {stats.gameStats.gamesPlayed} Spiele</span>
            <span className="text-emerald-600">✓ {stats.gameStats.gamesWon} gewonnen</span>
            <span className="text-red-600">✗ {stats.gameStats.gamesLost} verloren</span>
            {stats.gameStats.gamesZero > 0 && <span className="text-gray-500">○ {stats.gameStats.gamesZero} neutral</span>}
          </div>
        </div>
      )}

      {/* Serien-Ergebnisse */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <h2 className="font-semibold">Serien-Ergebnisse</h2>
        </div>
        <div className="divide-y">
          {stats.seriesData.map((sd) => (
            <div
              key={sd.seriesNumber}
              className="px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium">Serie {sd.seriesNumber}</span>
                {sd.isBye ? (
                  <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                    Aussetzer (Ø {sd.total.toFixed(1)})
                  </span>
                ) : (
                  <span className="text-sm text-gray-500">
                    Tisch {sd.tableNumber}
                    {sd.coPlayerIds.length > 0 && (
                      <span className="ml-1">
                        mit{' '}
                        {sd.coPlayerIds
                          .map(
                            (id) =>
                              tournament.players.find((p) => p.id === id)
                                ?.name.split(' ')[0] ?? '?',
                          )
                          .join(', ')}
                      </span>
                    )}
                  </span>
                )}
              </div>
              <span
                className={`font-bold ${
                  sd.total < 0
                    ? 'text-red-600'
                    : sd.total > 0
                      ? 'text-green-700'
                      : 'text-gray-500'
                }`}
              >
                {sd.isBye
                  ? sd.total.toFixed(1)
                  : sd.total}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Aussetzer-Info */}
      {stats.byeCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-semibold text-amber-800 mb-1">
            Aussetzer: {stats.byeCount}× von {tournament.series.length} Serien
          </h3>
          <p className="text-sm text-amber-700">
            Als Aussetzer-Wertung wird der Durchschnitt aller aktiven
            Spieler-Serien-Summen der jeweiligen Serie verwendet.
          </p>
        </div>
      )}

      {/* Co-Player Statistik */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <h2 className="font-semibold">Mitspieler-Statistik</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Wie oft war dieser Spieler mit anderen am selben Tisch?
          </p>
        </div>
        <div className="divide-y">
          {stats.coPlayers.map((cp) => (
            <div
              key={cp.id}
              className="px-4 py-2 flex items-center justify-between"
            >
              <Link
                href={`/turnier/spieler/${cp.id}`}
                className="text-sm text-emerald-700 hover:underline"
              >
                {cp.name}
              </Link>
              <span className="text-sm text-gray-600">
                {cp.count}× zusammen
              </span>
            </div>
          ))}
          {stats.coPlayers.length === 0 && (
            <div className="px-4 py-4 text-sm text-gray-400 text-center">
              Keine Mitspieler (nur Aussetzer-Serien)
            </div>
          )}
        </div>
      </div>

      {/* Tischzuordnungen */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <h2 className="font-semibold">Tischzuordnungen je Serie</h2>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {stats.seriesData.map((sd) => (
              <div
                key={sd.seriesNumber}
                className={`px-3 py-2 rounded-lg text-sm ${
                  sd.isBye
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-emerald-50 text-emerald-800'
                }`}
              >
                <span className="font-medium">S{sd.seriesNumber}:</span>{' '}
                {sd.isBye ? 'Pause' : `Tisch ${sd.tableNumber}`}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
