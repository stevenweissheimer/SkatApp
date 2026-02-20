import mongoose, { Schema, Document, Model } from 'mongoose';
import type { Tournament } from '@/types';

/* ===== Sub-Schemas ===== */

const GameSchema = new Schema(
  {
    gameNumber: { type: Number, required: true },
    scores: { type: Map, of: Schema.Types.Mixed }, // playerId → number | null
  },
  { _id: false },
);

const TableAssignmentSchema = new Schema(
  {
    tableNumber: { type: Number, required: true },
    playerIds: [{ type: String }],
    games: [GameSchema],
  },
  { _id: false },
);

const SeriesSchema = new Schema(
  {
    seriesNumber: { type: Number, required: true },
    tables: [TableAssignmentSchema],
    byePlayerIds: [{ type: String }],
    completed: { type: Boolean, default: false },
    byeAverageScore: { type: Number, default: null },
    notes: { type: String, default: '' },
  },
  { _id: false },
);

const PlayerSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    club: { type: String, default: '' },
    note: { type: String, default: '' },
  },
  { _id: false },
);

const PrizeRuleSchema = new Schema(
  {
    place: { type: Number, required: true },
    percent: { type: Number, required: true },
  },
  { _id: false },
);

/* ===== Tournament Document ===== */

export interface TournamentDocument extends Document {
  name: string;
  date: string;
  location: string;
  seriesCount: number;
  gamesPerSeries: number;
  entryFee: number;
  players: {
    id: string;
    name: string;
    club: string;
    note: string;
  }[];
  series: {
    seriesNumber: number;
    tables: {
      tableNumber: number;
      playerIds: string[];
      games: { gameNumber: number; scores: Map<string, number | null> }[];
    }[];
    byePlayerIds: string[];
    completed: boolean;
    byeAverageScore: number | null;
    notes: string;
  }[];
  planGenerated: boolean;
  prizeRules: { place: number; percent: number }[];
  prizePreset: string;
  extraPrizePool: number;
  houseRules: string;
  organizerName: string;
  organizerContact: string;
  /** Optionales Passwort zum Schutz des Turniers */
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const TournamentSchema = new Schema(
  {
    name: { type: String, required: true },
    date: { type: String, required: true },
    location: { type: String, default: '' },
    seriesCount: { type: Number, required: true },
    gamesPerSeries: { type: Number, required: true },
    entryFee: { type: Number, default: 0 },
    players: [PlayerSchema],
    series: [SeriesSchema],
    planGenerated: { type: Boolean, default: true },
    prizeRules: [PrizeRuleSchema],
    prizePreset: { type: String, default: 'top3' },
    extraPrizePool: { type: Number, default: 0 },
    houseRules: { type: String, default: '' },
    organizerName: { type: String, default: '' },
    organizerContact: { type: String, default: '' },
    password: { type: String, default: '' },
  },
  {
    timestamps: true,
  },
);

/**
 * Convert Mongoose document to plain Tournament object matching our TS types.
 * Handles Map → Record conversion for game scores.
 */
export function toPlainTournament(doc: TournamentDocument): Tournament {
  const obj = doc.toObject({ versionKey: false });

  return {
    id: obj._id.toString(),
    name: obj.name,
    date: obj.date,
    location: obj.location,
    seriesCount: obj.seriesCount,
    gamesPerSeries: obj.gamesPerSeries,
    entryFee: obj.entryFee,
    players: obj.players,
    series: obj.series.map((s: any) => ({
      seriesNumber: s.seriesNumber,
      tables: s.tables.map((t: any) => ({
        tableNumber: t.tableNumber,
        playerIds: t.playerIds,
        games: t.games.map((g: any) => ({
          gameNumber: g.gameNumber,
          scores:
            g.scores instanceof Map
              ? Object.fromEntries(g.scores)
              : g.scores ?? {},
        })),
      })),
      byePlayerIds: s.byePlayerIds,
      completed: s.completed,
      byeAverageScore: s.byeAverageScore,
      notes: s.notes ?? '',
    })),
    planGenerated: obj.planGenerated,
    prizeRules: obj.prizeRules,
    prizePreset: obj.prizePreset,
    extraPrizePool: obj.extraPrizePool,
    houseRules: obj.houseRules,
    organizerName: obj.organizerName,
    organizerContact: obj.organizerContact,
    hasPassword: !!obj.password,
    createdAt: obj.createdAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

export const TournamentModel: Model<TournamentDocument> =
  mongoose.models.Tournament ||
  mongoose.model<TournamentDocument>('Tournament', TournamentSchema);
