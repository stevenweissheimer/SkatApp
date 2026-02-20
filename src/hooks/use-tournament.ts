'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentStore } from '@/store/tournament-store';

/**
 * Hook: loads tournament by ID and optionally polls for live updates.
 * Returns { tournament, loading, error }
 */
export function useTournament(id: string, pollInterval?: number) {
  const tournament = useTournamentStore((s) => s.tournament);
  const loading = useTournamentStore((s) => s.loading);
  const error = useTournamentStore((s) => s.error);
  const loadTournament = useTournamentStore((s) => s.loadTournament);
  const refreshTournament = useTournamentStore((s) => s.refreshTournament);
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load tournament if not loaded or different ID
  useEffect(() => {
    if (!tournament || tournament.id !== id) {
      loadTournament(id);
    }
  }, [id, tournament?.id, loadTournament]);

  // Polling for live updates
  useEffect(() => {
    if (pollInterval && pollInterval > 0) {
      intervalRef.current = setInterval(() => {
        refreshTournament();
      }, pollInterval);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [pollInterval, refreshTournament]);

  return { tournament, loading, error };
}
