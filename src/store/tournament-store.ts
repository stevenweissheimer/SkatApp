import { create } from 'zustand';
import { Tournament } from '@/types';
import * as api from '@/lib/api';
import { calculateByeAverage } from '@/lib/scoring';

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
  loading: boolean;
  error: string | null;

  /** Turnier vom Server laden */
  loadTournament: (id: string) => Promise<void>;

  /** Turnier-Daten aktualisieren (re-fetch) */
  refreshTournament: () => Promise<void>;

  /** Turnier zurücksetzen (Store leeren) */
  clearTournament: () => void;

  /** Score aktualisieren (sendet an API, dann lokaler Optimistic Update) */
  updateScore: (
    seriesNumber: number,
    tableNumber: number,
    gameNumber: number,
    playerId: string,
    score: number | null,
  ) => Promise<void>;

  /** Serie abschließen */
  completeSeries: (seriesNumber: number) => Promise<void>;

  /** Serie wieder öffnen */
  reopenSeries: (seriesNumber: number) => Promise<void>;

  /** Einstellungen aktualisieren */
  updateSettings: (data: Partial<Tournament>) => Promise<void>;
}

export const useTournamentStore = create<TournamentStore>()((set, get) => ({
  tournament: null,
  loading: false,
  error: null,

  loadTournament: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const tournament = await api.getTournament(id);
      set({ tournament, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  refreshTournament: async () => {
    const { tournament } = get();
    if (!tournament) return;
    try {
      const fresh = await api.getTournament(tournament.id);
      set({ tournament: fresh });
    } catch {
      // Silently fail refresh — don't break UI
    }
  },

  clearTournament: () => {
    set({ tournament: null, error: null });
  },

  updateScore: async (seriesNumber, tableNumber, gameNumber, playerId, score) => {
    const { tournament } = get();
    if (!tournament) return;

    // Optimistic local update
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
              return { ...g, scores: { ...g.scores, [playerId]: score } };
            }),
          };
        }),
      };
    });
    set({ tournament: { ...tournament, series: newSeries } });

    // Send to server
    try {
      await api.updateScore(tournament.id, {
        seriesNumber,
        tableNumber,
        gameNumber,
        playerId,
        score,
      });
    } catch (e: any) {
      // Revert on error
      set({ tournament, error: e.message });
    }
  },

  completeSeries: async (seriesNumber) => {
    const { tournament } = get();
    if (!tournament) return;

    try {
      const updated = await api.completeSeries(tournament.id, seriesNumber);
      set({ tournament: updated });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  reopenSeries: async (seriesNumber) => {
    const { tournament } = get();
    if (!tournament) return;

    try {
      const updated = await api.reopenSeries(tournament.id, seriesNumber);
      set({ tournament: updated });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  updateSettings: async (data) => {
    const { tournament } = get();
    if (!tournament) return;

    try {
      const updated = await api.updateTournament(tournament.id, data);
      set({ tournament: updated });
    } catch (e: any) {
      set({ error: e.message });
    }
  },
}));
