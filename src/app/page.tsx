'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentStore } from '@/store/tournament-store';
import SetupWizard from '@/components/SetupWizard';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const tournament = useTournamentStore((s) => s.tournament);
  const loadDemo = useTournamentStore((s) => s.loadDemo);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && tournament?.planGenerated) {
      router.push('/turnier');
    }
  }, [mounted, tournament?.planGenerated, router]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-400">Laden…</div>
      </div>
    );
  }

  if (tournament?.planGenerated) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 pt-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-emerald-800 mb-2">
          🃏 Skat Turnierbuch
        </h1>
        <p className="text-gray-500">
          Digitales Turnierbuch für Skat-Turniere – Tischplanung, Ergebnisse
          &amp; Rangliste
        </p>
      </div>

      <SetupWizard />

      <div className="mt-8 text-center">
        <button
          onClick={loadDemo}
          className="text-sm text-gray-500 hover:text-emerald-700 underline underline-offset-2"
        >
          Demo-Turnier laden (10 Spieler, 2 Serien à 24 Spiele)
        </button>
      </div>
    </div>
  );
}
