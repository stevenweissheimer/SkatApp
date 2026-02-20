'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentStore } from '@/store/tournament-store';
import { calculateFairnessReport } from '@/lib/scoring';
import { getTotalPrizePool } from '@/lib/prizes';
import SeriesPlanner from '@/components/SeriesPlanner';
import FairnessDisplay from '@/components/FairnessDisplay';
import Link from 'next/link';

export default function TurnierPage() {
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

  const fairness = calculateFairnessReport(tournament);
  const numByes = tournament.players.length % 3;
  const totalPool = getTotalPrizePool(tournament);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Turnier-Info */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl shadow-lg p-6 text-white">
        <h1 className="text-3xl font-extrabold tracking-tight">
          {tournament.name}
        </h1>
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-sm text-emerald-100">
          <span className="inline-flex items-center gap-1.5">
            <span className="text-base">📅</span>
            {new Date(tournament.date + 'T00:00:00').toLocaleDateString(
              'de-DE',
              { day: '2-digit', month: 'long', year: 'numeric' },
            )}
          </span>
          {tournament.location && (
            <span className="inline-flex items-center gap-1.5">
              <span className="text-base">📍</span>
              {tournament.location}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <span className="text-base">👥</span>
            {tournament.players.length} Spieler
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-base">🎯</span>
            {tournament.seriesCount} Serien × {tournament.gamesPerSeries} Spiele
          </span>
          {tournament.entryFee > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span className="text-base">💰</span>
              {tournament.entryFee.toFixed(2)} € / Person
            </span>
          )}
          {numByes > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span className="text-base">⏸️</span>
              {numByes} Aussetzer/Serie
            </span>
          )}
          {totalPool > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span className="text-base">🏆</span>
              Preispool: {totalPool.toFixed(2)} €
            </span>
          )}
          {tournament.organizerName && (
            <span className="inline-flex items-center gap-1.5">
              <span className="text-base">👤</span>
              TL: {tournament.organizerName}
            </span>
          )}
        </div>
        {tournament.houseRules && (
          <div className="mt-3 pt-3 border-t border-emerald-500/30">
            <div className="text-xs text-emerald-200/80 whitespace-pre-line">
              📜 {tournament.houseRules}
            </div>
          </div>
        )}
      </div>

      {/* Fairness */}
      <FairnessDisplay report={fairness} />

      {/* Serien */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
          Serien &amp; Tischplan
        </h2>
        <SeriesPlanner tournament={tournament} />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-gray-400 rounded-full" />
          Schnellzugriff
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/turnier/einstellungen" className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors inline-flex items-center gap-2">
            ⚙️ Einstellungen
          </Link>
          <Link href="/turnier/rangliste" className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors inline-flex items-center gap-2">
            🏆 Rangliste
          </Link>
          <Link href="/turnier/export" className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors inline-flex items-center gap-2">
            💾 Export / Import
          </Link>
          <button
            onClick={() => {
              if (confirm('Neues Turnier starten?\nDas aktuelle Turnier wird gelöscht!\n\nTipp: Exportiere vorher über Export/Import.')) {
                useTournamentStore.getState().resetTournament();
                router.push('/');
              }
            }}
            className="px-4 py-2.5 bg-red-50 hover:bg-red-100 rounded-xl text-sm font-medium text-red-600 transition-colors inline-flex items-center gap-2"
          >
            🗑️ Neues Turnier
          </button>
        </div>
      </div>
    </div>
  );
}
