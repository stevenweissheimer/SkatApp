'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { listTournaments, deleteTournament, TournamentListItem } from '@/lib/api';

export default function HomePage() {
  const [tournaments, setTournaments] = useState<TournamentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = async () => {
    setLoading(true);
    try {
      const list = await listTournaments();
      setTournaments(list);
    } catch {
      // DB not available yet
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Turnier "${name}" wirklich löschen?\nDiese Aktion kann nicht rückgängig gemacht werden.`))
      return;
    await deleteTournament(id);
    load();
  };

  return (
    <div className="max-w-3xl mx-auto p-4 pt-8 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-emerald-800 mb-2 flex items-center justify-center gap-3">
          <span className="text-5xl">🃏</span>
          Skat Turnierbuch
        </h1>
        <p className="text-gray-500">
          Turniere verwalten, Ergebnisse eintragen, Tischkarten auf dem Handy ausfüllen
        </p>
      </div>

      {/* Neues Turnier Button */}
      <div className="text-center">
        <Link
          href="/neu"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
        >
          ➕ Neues Turnier anlegen
        </Link>
      </div>

      {/* Turnier-Liste */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">
          <div className="animate-pulse">Turniere laden…</div>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md border p-12 text-center">
          <span className="text-5xl block mb-4">📋</span>
          <p className="text-gray-600 font-medium text-lg">Noch keine Turniere vorhanden</p>
          <p className="text-gray-400 text-sm mt-2">
            Lege dein erstes Turnier an, um loszulegen!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
            Deine Turniere
          </h2>
          {tournaments.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all"
            >
              <Link
                href={`/turnier/${t.id}`}
                className="block p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{t.name}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        📅{' '}
                        {new Date(t.date + 'T00:00:00').toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      {t.location && (
                        <span className="inline-flex items-center gap-1">📍 {t.location}</span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        👥 {t.playerCount} Spieler
                      </span>
                      <span className="inline-flex items-center gap-1">
                        🎯 {t.seriesCount} × {t.gamesPerSeries}
                      </span>
                    </div>
                  </div>
                  <span className="text-emerald-500 text-xl shrink-0 ml-4">→</span>
                </div>
              </Link>
              <div className="px-5 pb-3 flex gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(t.id, t.name);
                  }}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  🗑️ Löschen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
