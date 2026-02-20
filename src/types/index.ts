/* ===== Datenmodelle für das Skat-Turnierbuch ===== */

/** Ein Turnierspieler */
export interface Player {
  id: string;
  name: string;
  club: string;
  note: string;
}

/** Ein einzelnes Spiel innerhalb eines Tisches (Spielnummer + Punkte je Spieler) */
export interface Game {
  gameNumber: number;
  /** playerId → Punktzahl (null = noch nicht eingetragen) */
  scores: Record<string, number | null>;
}

/** Tischzuordnung: Tischnummer + 3 Spieler + Spiele */
export interface TableAssignment {
  tableNumber: number;
  playerIds: string[];
  games: Game[];
}

/** Eine Serie (Runde) des Turniers */
export interface Series {
  seriesNumber: number;
  tables: TableAssignment[];
  /** IDs der Spieler, die in dieser Serie aussetzen */
  byePlayerIds: string[];
  completed: boolean;
  /** Durchschnitt der aktiven Spieler – wird bei Abschluss der Serie berechnet */
  byeAverageScore: number | null;
  /** Optionale Notizen zur Serie */
  notes: string;
}

/** Preisverteilung: Platz → Prozent des Preispools */
export interface PrizeRule {
  place: number;
  percent: number;
}

/** Vordefinierte Verteilungsschemata */
export type PrizePreset = 'top3' | 'top5' | 'top10' | 'custom';

/** Gesamtes Turnier */
export interface Tournament {
  id: string;
  name: string;
  date: string;
  location: string;
  seriesCount: number;
  gamesPerSeries: number;
  entryFee: number;
  players: Player[];
  series: Series[];
  planGenerated: boolean;
  createdAt: string;
  /** Preisverteilung */
  prizeRules: PrizeRule[];
  prizePreset: PrizePreset;
  /** Zusätzlicher Preispool (z.B. Sponsor-Geld) */
  extraPrizePool: number;
  /** Turnier-Regeln / Hinweise (Freitext) */
  houseRules: string;
  /** Kontaktinfo Turnierleiter */
  organizerName: string;
  organizerContact: string;
}

/* ===== Auswertungs-Typen ===== */

export interface SeriesPlayerResult {
  seriesNumber: number;
  total: number;
  isBye: boolean;
  tableNumber: number | null;
  coPlayers: string[];
}

export interface LeaderboardEntry {
  player: Player;
  grandTotal: number;
  rank: number;
  seriesResults: SeriesPlayerResult[];
}

export interface FairnessReport {
  overallScore: number;
  maxPairRepetition: number;
  byeDistribution: Record<string, number>;
  byeEvenness: 'good' | 'fair' | 'poor';
  tableDistribution: Record<string, Record<number, number>>;
  warnings: string[];
  pairDetails: { p1Name: string; p2Name: string; count: number }[];
}
