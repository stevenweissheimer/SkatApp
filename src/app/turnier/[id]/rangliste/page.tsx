'use client';

import { use, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTournament } from '@/hooks/use-tournament';
import { useTournamentStore } from '@/store/tournament-store';
import Leaderboard from '@/components/Leaderboard';
import { QRCodeSVG } from 'qrcode.react';
import { isSeriesComplete } from '@/lib/scoring';

export default function LeaderboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { tournament, loading } = useTournament(id, 5000);
  const refreshTournament = useTournamentStore((s) => s.refreshTournament);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showQR, setShowQR] = useState(true);
  const [origin, setOrigin] = useState('');

  // Get window origin on client
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Track when data actually changes
  useEffect(() => {
    if (tournament) {
      setLastUpdate(new Date());
    }
  }, [tournament]);

  // Find the next series that still needs scores entered
  // A series is "done" if it's officially completed OR all scores are filled in
  const activeSeries = useMemo(() => {
    if (!tournament) return null;
    return tournament.series.find((s) => !s.completed && !isSeriesComplete(s)) ?? null;
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
    <div className="max-w-6xl mx-auto p-4 pt-6 space-y-6 pb-52">
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

      {/* Sticky QR Code Bar */}
      {activeSeries && origin && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t-2 border-emerald-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                📱 QR-Codes – Serie {activeSeries.seriesNumber} Tischkarten
              </h3>
              <button
                onClick={() => setShowQR(!showQR)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
              >
                {showQR ? '▼ Einklappen' : '▲ Aufklappen'}
              </button>
            </div>
            {showQR && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                {activeSeries.tables.map((table) => {
                  const url = `${origin}/turnier/${id}/serie/${activeSeries.seriesNumber}/tisch/${table.tableNumber}`;
                  const playerNames = table.playerIds
                    .map((pid) => tournament.players.find((p) => p.id === pid)?.name ?? '?')
                    .join(', ');
                  return (
                    <div
                      key={table.tableNumber}
                      className="flex flex-col items-center gap-1.5 bg-gray-50 rounded-xl p-3 border border-gray-100 min-w-[130px] shrink-0"
                    >
                      <div className="text-xs font-bold text-emerald-700">
                        Tisch {table.tableNumber}
                      </div>
                      <div className="bg-white rounded-lg p-1.5 shadow-sm">
                        <QRCodeSVG
                          value={url}
                          size={90}
                          level="M"
                          bgColor="#ffffff"
                          fgColor="#064e3b"
                        />
                      </div>
                      <div className="text-[10px] text-gray-400 text-center leading-tight max-w-[120px] truncate" title={playerNames}>
                        {playerNames}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
