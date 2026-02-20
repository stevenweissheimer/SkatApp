/**
 * Demo-Turnier-Generator
 *
 * Erzeugt ein vollständiges Turnier mit 10 Spielern, 2 Serien à 24 Spielen.
 * Serie 1 ist mit realistischen Punkten vorbelegt und abgeschlossen,
 * Serie 2 ist leer und bereit zur Eingabe.
 */

import { Tournament, Player, Series } from '@/types';
import { generateAllSeriesPlans } from './planner';
import { calculateByeAverage } from './scoring';
import { getDefaultPrizeRules } from './prizes';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

const DEMO_PLAYERS: { name: string; club: string }[] = [
  { name: 'Hans Müller', club: 'SK Eichberg' },
  { name: 'Fritz Weber', club: 'SK Eichberg' },
  { name: 'Karl Schmidt', club: 'Skatfreunde Altstadt' },
  { name: 'Otto Braun', club: 'Skatfreunde Altstadt' },
  { name: 'Werner Klein', club: 'SC Tannenwald' },
  { name: 'Heinz Fischer', club: 'SC Tannenwald' },
  { name: 'Kurt Wagner', club: '' },
  { name: 'Walter Becker', club: 'Skatclub Harmonie' },
  { name: 'Ernst Hoffmann', club: 'Skatclub Harmonie' },
  { name: 'Günter Schäfer', club: '' },
];

/** Typische Skat-Spielwerte */
const GAME_VALUES = [18, 20, 22, 23, 24, 27, 33, 35, 36, 40, 44, 46, 48, 50, 54, 59, 60, 72];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Befüllt eine Serie mit realistischen Demo-Punkten.
 * Pro Spiel wird ein Alleinspieler bestimmt (rotierend), der mit 60 %
 * Wahrscheinlichkeit gewinnt. Gewinner bekommt +Spielwert,
 * Verlierer bekommen je −Spielwert bzw. bei Niederlage des Alleinspielers
 * bekommt dieser −2×Spielwert und die Gegenspieler je +Spielwert.
 */
function fillDemoScores(series: Series): void {
  for (const table of series.tables) {
    for (const game of table.games) {
      const pids = table.playerIds;
      const declarerIdx = (game.gameNumber - 1) % 3;
      const declarerWins = Math.random() > 0.4;
      const gameValue = randomPick(GAME_VALUES);

      if (declarerWins) {
        game.scores[pids[declarerIdx]] = gameValue;
        game.scores[pids[(declarerIdx + 1) % 3]] = 0;
        game.scores[pids[(declarerIdx + 2) % 3]] = 0;
      } else {
        game.scores[pids[declarerIdx]] = -gameValue * 2;
        game.scores[pids[(declarerIdx + 1) % 3]] = gameValue;
        game.scores[pids[(declarerIdx + 2) % 3]] = gameValue;
      }
    }
  }
}

export function createDemoTournament(): Tournament {
  const players: Player[] = DEMO_PLAYERS.map((p) => ({
    id: generateId() + Math.random().toString(36).substring(2, 6),
    name: p.name,
    club: p.club,
    note: '',
  }));

  const series = generateAllSeriesPlans(players, 2, 24);

  // Serie 1 mit Demo-Daten füllen und abschließen
  fillDemoScores(series[0]);
  series[0].byeAverageScore = calculateByeAverage(series[0], players);
  series[0].completed = true;

  // Serie 2 bleibt leer → Benutzer kann testen

  return {
    id: generateId(),
    name: 'Demo-Turnier 2026',
    date: '2026-02-20',
    location: 'Vereinsheim Eichberg',
    seriesCount: 2,
    gamesPerSeries: 24,
    entryFee: 10,
    players,
    series,
    planGenerated: true,
    createdAt: new Date().toISOString(),
    prizeRules: getDefaultPrizeRules('top3'),
    prizePreset: 'top3',
    extraPrizePool: 0,
    houseRules: 'Gespielt wird nach den Regeln der DSkV.\nAussetzer erhalten den Seriendurchschnitt.',
    organizerName: 'Hans Müller',
    organizerContact: 'mueller@sk-eichberg.de',
  };
}
