'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useTournament } from '@/hooks/use-tournament';
import { useTournamentStore } from '@/store/tournament-store';
import Leaderboard from '@/components/Leaderboard';

export default function LeaderboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { tournament, loading } = useTournament(id, 5000);
  const refreshTournament = useTournamentStore((s) => s.refreshTournament);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Track when data actually changes
  useEffect(() => {
    if (tournament) {
      setLastUpdate(new Date());
    }
  }, [tournament]);

  if (loading || !tournament) {
    return (
      <div className="max-w-6xl mx-auto p-4 pt-8">
        <div className="animate-pulse text-center py-20 text-gray-400 text-lg">
          Rangliste laden…
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 pt-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <Link
            href={`/turnier/${id}`}
            className="text-emerald-600 text-sm hover:underline mb-1 inline-flex items-center gap-1"
          >
            ← Übersicht
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            Rangliste
          </h1>
          <p className="text-sm text-gray-500 mt-1">{tournament.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Live · aktualisiert {lastUpdate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <button
            onClick={() => refreshTournament()}
            className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
          >
            ↻ Aktualisieren
          </button>
        </div>
      </div>
      <Leaderboard tournament={tournament} tournamentId={id} />
    </div>
  );
}
