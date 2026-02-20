/**
 * Scoring & Auswertung
 * ====================
 *
 * Aussetzer-Durchschnitt (BYE Average):
 *   Nach Abschluss einer Serie wird der arithmetische Mittelwert aller
 *   Serien-Summen der AKTIVEN Spieler berechnet. Jeder Aussetzer dieser
 *   Serie erhält diesen Wert als Serienpunktzahl.
 *
 *   Formel:  BYE_Avg = Σ(Serien-Summe aller aktiven Spieler) / Anzahl aktiver Spieler
 *
 *   Beispiel: 9 aktive Spieler mit Summen [100, 80, 40, 20, 0, -10, -30, -50, -80]
 *             → Summe = 70, Schnitt = 70/9 ≈ 7,78
 *             → Der Aussetzer bekommt 7,78 Punkte für diese Serie.
 */

import {
  Tournament,
  Series,
  Player,
  LeaderboardEntry,
  SeriesPlayerResult,
  FairnessReport,
} from '@/types';

/* ---------- Einzel-Berechnungen ---------- */

/** Serien-Summe eines Spielers (inkl. BYE-Durchschnitt wenn zutreffend) */
export function getPlayerSeriesTotal(series: Series, playerId: string): number {
  if (series.byePlayerIds.includes(playerId)) {
    return series.byeAverageScore ?? 0;
  }
  const table = series.tables.find((t) => t.playerIds.includes(playerId));
  if (!table) return 0;
  return table.games.reduce((sum, g) => sum + (g.scores[playerId] ?? 0), 0);
}

/** Berechnet den BYE-Durchschnitt für eine Serie */
export function calculateByeAverage(
  series: Series,
  allPlayers: Player[],
): number {
  const activeIds = allPlayers
    .map((p) => p.id)
    .filter((id) => !series.byePlayerIds.includes(id));

  if (activeIds.length === 0) return 0;

  const totals = activeIds.map((pid) => {
    const table = series.tables.find((t) => t.playerIds.includes(pid));
    if (!table) return 0;
    return table.games.reduce((sum, g) => sum + (g.scores[pid] ?? 0), 0);
  });

  const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
  return Math.round(avg * 100) / 100;
}

/* ---------- Vollständigkeits-Prüfungen ---------- */

/** Prüft ob alle Spiele einer Serie vollständig eingetragen sind */
export function isSeriesComplete(series: Series): boolean {
  return series.tables.every((table) =>
    table.games.every((game) =>
      table.playerIds.every(
        (id) => game.scores[id] !== null && game.scores[id] !== undefined,
      ),
    ),
  );
}

/** Fortschritt einer Serie in Zahlen */
export function getSeriesCompletionStats(series: Series): {
  totalGames: number;
  completedGames: number;
  percentage: number;
} {
  let totalGames = 0;
  let completedGames = 0;

  for (const table of series.tables) {
    for (const game of table.games) {
      totalGames++;
      const allFilled = table.playerIds.every(
        (id) => game.scores[id] !== null && game.scores[id] !== undefined,
      );
      if (allFilled) completedGames++;
    }
  }

  return {
    totalGames,
    completedGames,
    percentage:
      totalGames > 0
        ? Math.round((completedGames / totalGames) * 100)
        : 0,
  };
}

/* ---------- Rangliste ---------- */

export function getLeaderboard(tournament: Tournament): LeaderboardEntry[] {
  if (!tournament.planGenerated || tournament.series.length === 0) return [];

  const entries: LeaderboardEntry[] = tournament.players.map((player) => {
    const seriesResults: SeriesPlayerResult[] = tournament.series.map(
      (series) => {
        const isBye = series.byePlayerIds.includes(player.id);
        const table = series.tables.find((t) =>
          t.playerIds.includes(player.id),
        );
        const tableNumber = table?.tableNumber ?? null;
        const coPlayers = table
          ? table.playerIds.filter((id) => id !== player.id)
          : [];

        let total: number;
        if (isBye) {
          total = series.byeAverageScore ?? 0;
        } else if (table) {
          total = table.games.reduce(
            (sum, g) => sum + (g.scores[player.id] ?? 0),
            0,
          );
        } else {
          total = 0;
        }

        return {
          seriesNumber: series.seriesNumber,
          total: Math.round(total * 100) / 100,
          isBye,
          tableNumber: isBye ? null : tableNumber,
          coPlayers,
        };
      },
    );

    const grandTotal = Math.round(
      seriesResults.reduce((sum, r) => sum + r.total, 0) * 100,
    ) / 100;

    return { player, grandTotal, rank: 0, seriesResults };
  });

  // Absteigende Sortierung
  entries.sort((a, b) => b.grandTotal - a.grandTotal);

  // Ränge vergeben (mit Gleichstand-Behandlung)
  for (let i = 0; i < entries.length; i++) {
    if (i > 0 && entries[i].grandTotal === entries[i - 1].grandTotal) {
      entries[i].rank = entries[i - 1].rank;
    } else {
      entries[i].rank = i + 1;
    }
  }

  return entries;
}

/* ---------- Fairness-Analyse ---------- */

function pairKey(id1: string, id2: string): string {
  return id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
}

export function calculateFairnessReport(
  tournament: Tournament,
): FairnessReport {
  const pairCounts: Record<string, number> = {};
  const byeDistribution: Record<string, number> = {};
  const tableDistribution: Record<string, Record<number, number>> = {};

  for (const p of tournament.players) {
    byeDistribution[p.id] = 0;
    tableDistribution[p.id] = {};
  }

  for (const series of tournament.series) {
    for (const byeId of series.byePlayerIds) {
      byeDistribution[byeId] = (byeDistribution[byeId] || 0) + 1;
    }

    for (const table of series.tables) {
      for (let i = 0; i < table.playerIds.length; i++) {
        const pid = table.playerIds[i];
        if (!tableDistribution[pid]) tableDistribution[pid] = {};
        tableDistribution[pid][table.tableNumber] =
          (tableDistribution[pid][table.tableNumber] || 0) + 1;

        for (let j = i + 1; j < table.playerIds.length; j++) {
          const key = pairKey(table.playerIds[i], table.playerIds[j]);
          pairCounts[key] = (pairCounts[key] || 0) + 1;
        }
      }
    }
  }

  // Paar-Details aufbereiten
  const pairDetails: { p1Name: string; p2Name: string; count: number }[] = [];
  for (const [key, count] of Object.entries(pairCounts)) {
    const [id1, id2] = key.split('-');
    const p1 = tournament.players.find((p) => p.id === id1);
    const p2 = tournament.players.find((p) => p.id === id2);
    if (p1 && p2) {
      pairDetails.push({ p1Name: p1.name, p2Name: p2.name, count });
    }
  }
  pairDetails.sort((a, b) => b.count - a.count);

  const maxPairRepetition =
    pairDetails.length > 0
      ? Math.max(...pairDetails.map((p) => p.count))
      : 0;

  // BYE-Gleichmäßigkeit
  const byeValues = Object.values(byeDistribution);
  const byeMin = byeValues.length > 0 ? Math.min(...byeValues) : 0;
  const byeMax = byeValues.length > 0 ? Math.max(...byeValues) : 0;

  let byeEvenness: 'good' | 'fair' | 'poor' = 'good';
  if (byeMax - byeMin > 1) byeEvenness = 'poor';
  else if (byeMax > 0 && byeMax - byeMin <= 1) byeEvenness = 'good';

  // Warnungen
  const warnings: string[] = [];

  if (byeEvenness === 'poor') {
    const maxByePlayers = tournament.players.filter(
      (p) => byeDistribution[p.id] === byeMax,
    );
    warnings.push(
      `${maxByePlayers.map((p) => p.name).join(', ')} setzt ${byeMax}× aus (Maximum)`,
    );
  }

  const highPairs = pairDetails.filter((p) => p.count > 1);
  for (const pair of highPairs.slice(0, 5)) {
    warnings.push(
      `${pair.p1Name} & ${pair.p2Name} sitzen ${pair.count}× zusammen`,
    );
  }

  // Gesamtscore (Heuristik: 100 = perfekt)
  const numSeries = tournament.series.length;
  const numPlayers = tournament.players.length;

  if (numSeries === 0 || numPlayers < 3) {
    return {
      overallScore: 100,
      maxPairRepetition,
      byeDistribution,
      byeEvenness,
      tableDistribution,
      warnings: [],
      pairDetails,
    };
  }

  const pairPenalty = Object.values(pairCounts).reduce(
    (sum, c) => sum + Math.max(0, c - 1),
    0,
  );
  const byePenalty = (byeMax - byeMin) * 3;
  const maxPossiblePenalty = numPlayers * numSeries;
  const totalPenalty = pairPenalty + byePenalty;
  const score = Math.max(
    0,
    Math.round(100 - (totalPenalty / Math.max(maxPossiblePenalty, 1)) * 100),
  );

  return {
    overallScore: Math.min(100, Math.max(0, score)),
    maxPairRepetition,
    byeDistribution,
    byeEvenness,
    tableDistribution,
    warnings,
    pairDetails,
  };
}
