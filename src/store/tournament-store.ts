import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Tournament, Player, PrizeRule, PrizePreset } from '@/types';
import { generateAllSeriesPlans } from '@/lib/planner';
import { calculateByeAverage } from '@/lib/scoring';
import { createDemoTournament } from '@/lib/demo';
import { getDefaultPrizeRules } from '@/lib/prizes';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/** Prüft ob in irgendeiner Serie bereits Punkte eingetragen sind */
export function hasAnyScores(tournament: Tournament): boolean {
  return tournament.series.some((s) =>
    s.tables.some((t) =>
      t.games.some((g) =>
        Object.values(g.scores).some((v) => v !== null && v !== undefined),
      ),
    ),
  );
}

interface TournamentStore {
  tournament: Tournament | null;

  createAndGenerate: (data: {
    name: string;
    date: string;
    location: string;
    seriesCount: number;
    gamesPerSeries: number;
    entryFee: number;
    players: Player[];
    prizeRules: PrizeRule[];
    prizePreset: PrizePreset;
    extraPrizePool: number;
    houseRules: string;
    organizerName: string;
    organizerContact: string;
  }) => void;

  resetTournament: () => void;

  updateScore: (
    seriesNumber: number,
    tableNumber: number,
    gameNumber: number,
    playerId: string,
    score: number | null,
  ) => void;

  completeSeries: (seriesNumber: number) => void;
  reopenSeries: (seriesNumber: number) => void;

  updateSettings: (data: {
    name: string;
    date: string;
    location: string;
    entryFee: number;
    prizeRules: PrizeRule[];
    prizePreset: PrizePreset;
    extraPrizePool: number;
    houseRules: string;
    organizerName: string;
    organizerContact: string;
  }) => void;

  updatePlayersAndRegenerate: (
    players: Player[],
    seriesCount: number,
    gamesPerSeries: number,
  ) => void;

  updateSeriesNotes: (seriesNumber: number, notes: string) => void;

  /** Setzt alle Ergebnisse & Serien zurück, behält Spieler & Plan */
  resetAllScores: () => void;

  importTournament: (tournament: Tournament) => void;
  loadDemo: () => void;
}

export const useTournamentStore = create<TournamentStore>()(
  persist(
    (set, get) => ({
      tournament: null,

      createAndGenerate: (data) => {
        const series = generateAllSeriesPlans(
          data.players,
          data.seriesCount,
          data.gamesPerSeries,
        );
        set({
          tournament: {
            id: generateId(),
            name: data.name,
            date: data.date,
            location: data.location,
            seriesCount: data.seriesCount,
            gamesPerSeries: data.gamesPerSeries,
            entryFee: data.entryFee,
            players: data.players,
            series,
            planGenerated: true,
            createdAt: new Date().toISOString(),
            prizeRules: data.prizeRules,
            prizePreset: data.prizePreset,
            extraPrizePool: data.extraPrizePool,
            houseRules: data.houseRules,
            organizerName: data.organizerName,
            organizerContact: data.organizerContact,
          },
        });
      },

      resetTournament: () => {
        set({ tournament: null });
      },

      updateScore: (seriesNumber, tableNumber, gameNumber, playerId, score) => {
        const { tournament } = get();
        if (!tournament) return;

        const newSeries = tournament.series.map((s) => {
          if (s.seriesNumber !== seriesNumber) return s;
          return {
            ...s,
            tables: s.tables.map((t) => {
              if (t.tableNumber !== tableNumber) return t;
              return {
                ...t,
                games: t.games.map((g) => {
                  if (g.gameNumber !== gameNumber) return g;
                  return {
                    ...g,
                    scores: { ...g.scores, [playerId]: score },
                  };
                }),
              };
            }),
          };
        });

        set({ tournament: { ...tournament, series: newSeries } });
      },

      completeSeries: (seriesNumber) => {
        const { tournament } = get();
        if (!tournament) return;

        const newSeries = tournament.series.map((s) => {
          if (s.seriesNumber !== seriesNumber) return s;
          const byeAvg = calculateByeAverage(s, tournament.players);
          return { ...s, completed: true, byeAverageScore: byeAvg };
        });

        set({ tournament: { ...tournament, series: newSeries } });
      },

      reopenSeries: (seriesNumber) => {
        const { tournament } = get();
        if (!tournament) return;

        const newSeries = tournament.series.map((s) => {
          if (s.seriesNumber !== seriesNumber) return s;
          return { ...s, completed: false, byeAverageScore: null };
        });

        set({ tournament: { ...tournament, series: newSeries } });
      },

      updateSettings: (data) => {
        const { tournament } = get();
        if (!tournament) return;
        set({
          tournament: {
            ...tournament,
            name: data.name,
            date: data.date,
            location: data.location,
            entryFee: data.entryFee,
            prizeRules: data.prizeRules,
            prizePreset: data.prizePreset,
            extraPrizePool: data.extraPrizePool,
            houseRules: data.houseRules,
            organizerName: data.organizerName,
            organizerContact: data.organizerContact,
          },
        });
      },

      updatePlayersAndRegenerate: (players, seriesCount, gamesPerSeries) => {
        const { tournament } = get();
        if (!tournament) return;
        if (hasAnyScores(tournament)) return;

        const series = generateAllSeriesPlans(
          players,
          seriesCount,
          gamesPerSeries,
        );

        set({
          tournament: {
            ...tournament,
            players,
            seriesCount,
            gamesPerSeries,
            series,
          },
        });
      },

      updateSeriesNotes: (seriesNumber, notes) => {
        const { tournament } = get();
        if (!tournament) return;

        const newSeries = tournament.series.map((s) =>
          s.seriesNumber === seriesNumber ? { ...s, notes } : s,
        );

        set({ tournament: { ...tournament, series: newSeries } });
      },

      resetAllScores: () => {
        const { tournament } = get();
        if (!tournament) return;

        const freshSeries = generateAllSeriesPlans(
          tournament.players,
          tournament.seriesCount,
          tournament.gamesPerSeries,
        );
        // Preserve notes
        for (let i = 0; i < freshSeries.length; i++) {
          if (tournament.series[i]?.notes) {
            freshSeries[i].notes = tournament.series[i].notes;
          }
        }
        set({ tournament: { ...tournament, series: freshSeries } });
      },

      importTournament: (tournament) => {
        const migrated = {
          ...tournament,
          prizeRules: tournament.prizeRules ?? getDefaultPrizeRules('top3'),
          prizePreset: tournament.prizePreset ?? ('top3' as const),
          extraPrizePool: tournament.extraPrizePool ?? 0,
          houseRules: tournament.houseRules ?? '',
          organizerName: tournament.organizerName ?? '',
          organizerContact: tournament.organizerContact ?? '',
          series: tournament.series.map((s) => ({
            ...s,
            notes: s.notes ?? '',
          })),
        };
        set({ tournament: migrated });
      },

      loadDemo: () => {
        set({ tournament: createDemoTournament() });
      },
    }),
    {
      name: 'skat-turnier-storage',
      onRehydrateStorage: () => (state) => {
        // Migrate old tournaments loaded from localStorage
        if (state?.tournament) {
          const t = state.tournament;
          if (!t.prizeRules) t.prizeRules = getDefaultPrizeRules('top3');
          if (!t.prizePreset) t.prizePreset = 'top3';
          if (t.extraPrizePool === undefined) t.extraPrizePool = 0;
          if (!t.houseRules) t.houseRules = '';
          if (!t.organizerName) t.organizerName = '';
          if (!t.organizerContact) t.organizerContact = '';
          for (const s of t.series) {
            if (s.notes === undefined) s.notes = '';
          }
        }
      },
    },
  ),
);
