'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTournamentStore } from '@/store/tournament-store';
import Leaderboard from '@/components/Leaderboard';

export default function RanglistePage() {
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <Link
              href="/turnier"
              className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Übersicht
            </Link>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-2 flex items-center gap-3">
              🏆 Rangliste
            </h1>
          </div>
          <div className="badge bg-emerald-100 text-emerald-700 text-sm py-1.5 px-4">
            {tournament.series.filter((s) => s.completed).length} /{' '}
            {tournament.series.length} Serien abgeschlossen
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-3 text-sm text-blue-700 flex items-start gap-2">
        <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <span>
          Live-Aktualisierung. Aussetzer-Punkte (Ø) werden nach Serien-Abschluss gutgeschrieben. Klicke auf einen Spieler für Details.
        </span>
      </div>

      <Leaderboard tournament={tournament} />
    </div>
  );
}
