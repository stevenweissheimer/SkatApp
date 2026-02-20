'use client';

import { use } from 'react';
import Link from 'next/link';
import { useTournament } from '@/hooks/use-tournament';
import PlayerDetail from '@/components/PlayerDetail';

export default function PlayerDetailPage({
  params,
}: {
  params: Promise<{ id: string; playerId: string }>;
}) {
  const { id, playerId } = use(params);
  const { tournament, loading, error } = useTournament(id);

  if (loading || !tournament) {
    return (
      <div className="max-w-4xl mx-auto p-4 pt-8">
        <div className="animate-pulse text-center py-20 text-gray-400 text-lg">
          Spieler laden…
        </div>
      </div>
    );
  }

  const player = tournament.players.find((p) => p.id === playerId);

  if (!player) {
    return (
      <div className="max-w-4xl mx-auto p-4 pt-8 text-center">
        <p className="text-gray-600">Spieler nicht gefunden.</p>
        <Link
          href={`/turnier/${id}`}
          className="text-emerald-600 hover:underline mt-2 inline-block"
        >
          ← Zur Übersicht
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pt-6 space-y-6">
      <div>
        <div className="flex gap-3 text-sm mb-1">
          <Link
            href={`/turnier/${id}`}
            className="text-emerald-600 hover:underline inline-flex items-center gap-1"
          >
            ← Übersicht
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href={`/turnier/${id}/rangliste`}
            className="text-emerald-600 hover:underline"
          >
            Rangliste
          </Link>
        </div>
      </div>
      <PlayerDetail tournament={tournament} player={player} tournamentId={id} />
    </div>
  );
}
