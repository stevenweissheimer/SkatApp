'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTournamentStore } from '@/store/tournament-store';
import PlayerDetailComponent from '@/components/PlayerDetail';

export default function PlayerPage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = use(params);
  const [mounted, setMounted] = useState(false);
  const tournament = useTournamentStore((s) => s.tournament);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Laden…</div>
      </div>
    );
  }

  if (!tournament?.planGenerated) {
    router.push('/');
    return null;
  }

  const player = tournament.players.find((p) => p.id === playerId);

  if (!player) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <div className="bg-red-50 text-red-700 p-4 rounded-xl">
          Spieler nicht gefunden.
        </div>
        <Link
          href="/turnier/rangliste"
          className="text-emerald-600 hover:underline mt-4 inline-block"
        >
          ← Zurück zur Rangliste
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <Link
        href="/turnier/rangliste"
        className="text-sm text-emerald-600 hover:underline"
      >
        ← Rangliste
      </Link>

      <PlayerDetailComponent tournament={tournament} player={player} />
    </div>
  );
}
