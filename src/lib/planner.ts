/**
 * Skat Tournament Table Planner
 * ==============================
 *
 * Algorithmus: Monte-Carlo-Optimierung mit gieriger BYE-Auswahl
 *
 * Für jede Serie:
 * 1. BYE-Auswahl:
 *    - Spieler, die bisher am seltensten ausgesetzt haben, werden bevorzugt.
 *    - Gleichstände werden zufällig aufgelöst (Fisher-Yates-Shuffle).
 *
 * 2. Tischzuordnung (Monte-Carlo, 2 000 Iterationen):
 *    - Zufällige Permutationen der aktiven Spieler werden erzeugt.
 *    - Jede Permutation wird in aufeinanderfolgende 3er-Gruppen unterteilt.
 *    - Kostenfunktion:
 *        a) Paar-Wiederholung (Gewicht 10): Wie oft saß dasselbe Paar
 *           bereits an einem gemeinsamen Tisch.
 *        b) Tischnummer-Wiederholung (Gewicht 1): Wie oft saß ein Spieler
 *           bereits am selben Tischnummer.
 *    - Die Permutation mit den niedrigsten Kosten wird gewählt.
 *
 * Ergebnis: Nahezu optimale Verteilung für typische Turniergrößen (3–50 Spieler),
 * Laufzeit unter einer Sekunde.
 */

import { Player, Series, TableAssignment, Game } from '@/types';

/* ---------- Hilfsfunktionen ---------- */

/** Fisher-Yates-Shuffle (erzeugt Kopie) */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Kanonischer Paar-Schlüssel (sortierte IDs) */
function pairKey(id1: string, id2: string): string {
  return id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
}

/**
 * Bewertet eine Spieler-Permutation anhand historischer Paar- und Tisch-Daten.
 * Niedrigere Kosten = bessere Verteilung.
 */
function calculateCost(
  playerIds: string[],
  numTables: number,
  pairHistory: Record<string, number>,
  tableHistory: Record<string, Record<number, number>>,
): number {
  let cost = 0;

  for (let t = 0; t < numTables; t++) {
    const ids = playerIds.slice(t * 3, t * 3 + 3);
    const tableNum = t + 1;

    // Paar-Wiederholungskosten (Gewicht 10)
    for (let i = 0; i < 3; i++) {
      for (let j = i + 1; j < 3; j++) {
        const key = pairKey(ids[i], ids[j]);
        cost += (pairHistory[key] || 0) * 10;
      }
    }

    // Tischnummer-Wiederholungskosten (Gewicht 1)
    for (const pid of ids) {
      cost += (tableHistory[pid]?.[tableNum] || 0);
    }
  }

  return cost;
}

/* ---------- Hauptfunktion ---------- */

/**
 * Erzeugt für alle Serien die Tischzuordnungen inkl. BYE-Spieler und leerer Spiele.
 *
 * @param players        Spielerliste
 * @param seriesCount    Anzahl Serien
 * @param gamesPerSeries Spiele pro Serie
 * @returns              Array von Series-Objekten (ohne Punkte)
 */
export function generateAllSeriesPlans(
  players: Player[],
  seriesCount: number,
  gamesPerSeries: number,
): Series[] {
  const numByes = players.length % 3;
  const numTables = Math.floor(players.length / 3);

  // Historien über alle Serien hinweg
  const pairHistory: Record<string, number> = {};
  const tableHistory: Record<string, Record<number, number>> = {};
  const byeCount: Record<string, number> = {};

  for (const p of players) {
    byeCount[p.id] = 0;
    tableHistory[p.id] = {};
  }

  const allSeries: Series[] = [];

  for (let s = 0; s < seriesCount; s++) {
    /* ---- Schritt 1: BYE-Spieler wählen ---- */
    let byePlayerIds: string[] = [];

    if (numByes > 0) {
      // Shuffle → stabile Sortierung nach byeCount → die ersten numByes nehmen
      const shuffled = shuffle(players);
      const sorted = [...shuffled].sort(
        (a, b) => (byeCount[a.id] || 0) - (byeCount[b.id] || 0),
      );
      byePlayerIds = sorted.slice(0, numByes).map((p) => p.id);

      for (const id of byePlayerIds) {
        byeCount[id] = (byeCount[id] || 0) + 1;
      }
    }

    /* ---- Schritt 2: Aktive Spieler an Tische verteilen ---- */
    const activeIds = players
      .filter((p) => !byePlayerIds.includes(p.id))
      .map((p) => p.id);

    const ITERATIONS = 2000;
    let bestCost = Infinity;
    let bestPerm = activeIds;

    for (let iter = 0; iter < ITERATIONS; iter++) {
      const perm = shuffle(activeIds);
      const cost = calculateCost(perm, numTables, pairHistory, tableHistory);

      if (cost < bestCost) {
        bestCost = cost;
        bestPerm = perm;
      }
      // Frühzeitiger Abbruch bei perfekter Lösung
      if (bestCost === 0) break;
    }

    /* ---- Schritt 3: Tische & Spiele anlegen ---- */
    const tables: TableAssignment[] = [];

    for (let t = 0; t < numTables; t++) {
      const tablePlayerIds = bestPerm.slice(t * 3, t * 3 + 3);
      const tableNum = t + 1;

      // Historien aktualisieren
      for (let i = 0; i < 3; i++) {
        for (let j = i + 1; j < 3; j++) {
          const key = pairKey(tablePlayerIds[i], tablePlayerIds[j]);
          pairHistory[key] = (pairHistory[key] || 0) + 1;
        }
        if (!tableHistory[tablePlayerIds[i]]) {
          tableHistory[tablePlayerIds[i]] = {};
        }
        tableHistory[tablePlayerIds[i]][tableNum] =
          (tableHistory[tablePlayerIds[i]][tableNum] || 0) + 1;
      }

      // Leere Spiele erzeugen
      const games: Game[] = [];
      for (let g = 1; g <= gamesPerSeries; g++) {
        const scores: Record<string, number | null> = {};
        for (const pid of tablePlayerIds) {
          scores[pid] = null;
        }
        games.push({ gameNumber: g, scores });
      }

      tables.push({ tableNumber: tableNum, playerIds: tablePlayerIds, games });
    }

    allSeries.push({
      seriesNumber: s + 1,
      tables,
      byePlayerIds,
      completed: false,
      byeAverageScore: null,
      notes: '',
    });
  }

  return allSeries;
}
