'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { listTournaments, deleteTournament, getStoredPassword, setStoredPassword, TournamentListItem } from '@/lib/api';

export default function HomePage() {
  const [tournaments, setTournaments] = useState<TournamentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      const list = await listTournaments(query || undefined);
      setTournaments(list);
    } catch {
      // DB not available yet
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* Debounced search – 300 ms nach Eingabe */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      load(search);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, load]);

  const handleDelete = async (id: string, name: string, hasPassword: boolean) => {
    if (!confirm(`Turnier "${name}" wirklich löschen?\nDiese Aktion kann nicht rückgängig gemacht werden.`))
      return;

    // Wenn passwortgeschützt und kein gespeichertes Passwort: abfragen
    if (hasPassword && !getStoredPassword(id)) {
      const pw = prompt('Dieses Turnier ist passwortgeschützt.\nBitte Passwort eingeben:');
      if (!pw) return;
      setStoredPassword(id, pw);
    }

    try {
      await deleteTournament(id);
      load(search);
    } catch (e: any) {
      alert('Fehler beim Löschen: ' + (e.message || 'Unbekannter Fehler'));
    }
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

      {/* Suche */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">🔍</span>
        <input
          type="text"
          placeholder="Turnier suchen (Name, Ort, Datum)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-10 py-3 rounded-xl border border-gray-200 shadow-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-gray-700 placeholder:text-gray-400"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-lg"
            title="Suche zurücksetzen"
          >
            ✕
          </button>
        )}
      </div>

      {/* Turnier-Liste */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">
          <div className="animate-pulse">Turniere laden…</div>
        </div>
      ) : tournaments.length === 0 && !search ? (
        <div className="bg-white rounded-2xl shadow-md border p-12 text-center">
          <span className="text-5xl block mb-4">📋</span>
          <p className="text-gray-600 font-medium text-lg">Noch keine Turniere vorhanden</p>
          <p className="text-gray-400 text-sm mt-2">
            Lege dein erstes Turnier an, um loszulegen!
          </p>
        </div>
      ) : tournaments.length === 0 && search ? (
        <div className="bg-white rounded-2xl shadow-md border p-12 text-center">
          <span className="text-5xl block mb-4">🔍</span>
          <p className="text-gray-600 font-medium text-lg">Keine Treffer für &ldquo;{search}&rdquo;</p>
          <p className="text-gray-400 text-sm mt-2">
            Versuche einen anderen Suchbegriff.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
            Aktuelle Turniere
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
                    <h3 className="text-lg font-bold text-gray-800">
                      {t.hasPassword && <span title="Passwortgeschützt">🔒 </span>}
                      {t.name}
                    </h3>
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
                    handleDelete(t.id, t.name, t.hasPassword);
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
