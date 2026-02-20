'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTournamentStore, hasAnyScores } from '@/store/tournament-store';
import { Player, PrizeRule, PrizePreset } from '@/types';
import { getDefaultPrizeRules, validatePrizeRules, getTotalPrizePool } from '@/lib/prizes';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const tournament = useTournamentStore((s) => s.tournament);
  const updateSettings = useTournamentStore((s) => s.updateSettings);
  const updatePlayersAndRegenerate = useTournamentStore((s) => s.updatePlayersAndRegenerate);
  const resetAllScores = useTournamentStore((s) => s.resetAllScores);
  const router = useRouter();

  /* ---- Lokaler State für Formulare ---- */
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [entryFee, setEntryFee] = useState(0);
  const [extraPrizePool, setExtraPrizePool] = useState(0);
  const [prizePreset, setPrizePreset] = useState<PrizePreset>('top3');
  const [prizeRules, setPrizeRules] = useState<PrizeRule[]>([]);
  const [houseRules, setHouseRules] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [organizerContact, setOrganizerContact] = useState('');

  // Spieler-Bearbeitung
  const [players, setPlayers] = useState<Player[]>([]);
  const [seriesCount, setSeriesCount] = useState(2);
  const [gamesPerSeries, setGamesPerSeries] = useState(24);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerClub, setNewPlayerClub] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editClub, setEditClub] = useState('');

  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'prizes' | 'players' | 'rules'>('general');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (tournament) {
      setName(tournament.name);
      setDate(tournament.date);
      setLocation(tournament.location);
      setEntryFee(tournament.entryFee);
      setExtraPrizePool(tournament.extraPrizePool ?? 0);
      setPrizePreset(tournament.prizePreset ?? 'top3');
      setPrizeRules(tournament.prizeRules ?? getDefaultPrizeRules('top3'));
      setHouseRules(tournament.houseRules ?? '');
      setOrganizerName(tournament.organizerName ?? '');
      setOrganizerContact(tournament.organizerContact ?? '');
      setPlayers([...tournament.players]);
      setSeriesCount(tournament.seriesCount);
      setGamesPerSeries(tournament.gamesPerSeries);
    }
  }, [tournament]);

  if (!mounted) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-gray-400">Laden…</div></div>;
  }
  if (!tournament?.planGenerated) { router.push('/'); return null; }

  const scoresExist = hasAnyScores(tournament);
  const canEditPlayers = !scoresExist;
  const numByes = players.length >= 3 ? players.length % 3 : 0;

  const prizeValidation = validatePrizeRules(prizeRules);
  const pool = entryFee * players.length + extraPrizePool;

  /* ---- Spieler-Aktionen ---- */
  const addPlayer = () => {
    const trimmed = newPlayerName.trim();
    if (!trimmed) return;
    setPlayers((prev) => [...prev, { id: generateId(), name: trimmed, club: newPlayerClub.trim(), note: '' }]);
    setNewPlayerName('');
    setNewPlayerClub('');
  };

  const removePlayer = (id: string) => setPlayers((prev) => prev.filter((p) => p.id !== id));

  const startEdit = (player: Player) => {
    setEditingId(player.id);
    setEditName(player.name);
    setEditClub(player.club);
  };

  const saveEdit = () => {
    if (!editingId) return;
    setPlayers((prev) => prev.map((p) => p.id === editingId ? { ...p, name: editName.trim() || p.name, club: editClub.trim() } : p));
    setEditingId(null);
  };

  /* ---- Preis-Presets ---- */
  const handlePresetChange = (preset: PrizePreset) => {
    setPrizePreset(preset);
    if (preset !== 'custom') setPrizeRules(getDefaultPrizeRules(preset));
  };

  const addPrizeRule = () => {
    const next = prizeRules.length > 0 ? Math.max(...prizeRules.map((r) => r.place)) + 1 : 1;
    setPrizeRules([...prizeRules, { place: next, percent: 0 }]);
  };

  const removePrizeRule = (place: number) => setPrizeRules(prizeRules.filter((r) => r.place !== place));

  const updatePrizeRule = (place: number, percent: number) => {
    setPrizeRules(prizeRules.map((r) => (r.place === place ? { ...r, percent } : r)));
  };

  /* ---- Speichern ---- */
  const handleSaveGeneral = () => {
    updateSettings({
      name: name.trim(),
      date,
      location: location.trim(),
      entryFee,
      prizeRules,
      prizePreset,
      extraPrizePool,
      houseRules: houseRules.trim(),
      organizerName: organizerName.trim(),
      organizerContact: organizerContact.trim(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSavePlayers = () => {
    if (players.length < 3) { alert('Mindestens 3 Spieler benötigt'); return; }
    if (!canEditPlayers) { alert('Spieler können nicht mehr geändert werden, da bereits Ergebnisse eingetragen sind.'); return; }
    if (confirm('Spielerliste & Tischplan neu generieren?\nAlle bisherigen (leeren) Serien werden neu erstellt.')) {
      updatePlayersAndRegenerate(players, seriesCount, gamesPerSeries);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const tabs = [
    { key: 'general' as const, label: '📋 Allgemein' },
    { key: 'prizes' as const, label: '💰 Preisgeld' },
    { key: 'players' as const, label: '👥 Spieler' },
    { key: 'rules' as const, label: '📜 Regeln' },
  ];

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div>
        <Link href="/turnier" className="text-sm text-emerald-600 hover:underline">← Übersicht</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-1">⚙️ Turnier-Einstellungen</h1>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium animate-pulse">
          ✓ Gespeichert!
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-white border border-b-white -mb-px text-emerald-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============ ALLGEMEIN ============ */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Turniername *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Datum *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ort</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Turnierleiter</label>
              <input type="text" value={organizerName} onChange={(e) => setOrganizerName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kontakt</label>
              <input type="text" value={organizerContact} onChange={(e) => setOrganizerContact(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Einsatz pro Person (€)</label>
            <input type="number" min={0} step={0.5} value={entryFee}
              onChange={(e) => setEntryFee(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
          </div>
          <button onClick={handleSaveGeneral}
            className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">
            💾 Änderungen speichern
          </button>
        </div>
      )}

      {/* ============ PREISGELD ============ */}
      {activeTab === 'prizes' && (
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <div className="bg-emerald-50 p-4 rounded-lg">
            <div className="text-sm text-emerald-700 font-medium mb-1">Preispool</div>
            <div className="text-2xl font-bold text-emerald-800">{pool.toFixed(2)} €</div>
            <div className="text-xs text-emerald-600 mt-1">
              {entryFee > 0 ? `${entryFee.toFixed(2)} € × ${players.length} Spieler = ${(entryFee * players.length).toFixed(2)} €` : 'Kein Einsatz'}
              {extraPrizePool > 0 && ` + ${extraPrizePool.toFixed(2)} € extra`}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zusätzlicher Preispool (€)</label>
            <input type="number" min={0} step={1} value={extraPrizePool}
              onChange={(e) => setExtraPrizePool(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Schema</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'top3' as PrizePreset, label: 'Top 3', desc: '50/30/20' },
                { key: 'top5' as PrizePreset, label: 'Top 5', desc: '35/25/20/12/8' },
                { key: 'top10' as PrizePreset, label: 'Top 10', desc: '25–2%' },
                { key: 'custom' as PrizePreset, label: 'Eigenes', desc: 'Frei wählbar' },
              ].map((p) => (
                <button key={p.key} onClick={() => handlePresetChange(p.key)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    prizePreset === p.key ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <div className="font-medium text-sm">{p.label}</div>
                  <div className="text-xs text-gray-500">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {prizeRules.map((rule) => (
              <div key={rule.place} className="flex items-center gap-2">
                <span className="w-16 text-sm text-gray-600 shrink-0">{rule.place}. Platz</span>
                <input type="number" min={0} max={100} value={rule.percent}
                  onChange={(e) => { updatePrizeRule(rule.place, Math.max(0, parseFloat(e.target.value) || 0)); if (prizePreset !== 'custom') setPrizePreset('custom'); }}
                  className="w-20 px-2 py-1.5 border rounded-lg text-sm text-center focus:ring-2 focus:ring-emerald-500" />
                <span className="text-sm text-gray-500">%</span>
                <span className="text-sm text-gray-400 ml-2">≈ {(pool * rule.percent / 100).toFixed(2)} €</span>
                {prizePreset === 'custom' && (
                  <button onClick={() => removePrizeRule(rule.place)} className="ml-auto text-gray-400 hover:text-red-500 text-sm">✕</button>
                )}
              </div>
            ))}
            {prizePreset === 'custom' && (
              <button onClick={addPrizeRule} className="text-sm text-emerald-600 hover:text-emerald-700">+ Platz hinzufügen</button>
            )}
            <div className={`text-sm mt-2 p-2 rounded ${
              prizeValidation.totalPercent === 100 ? 'bg-green-50 text-green-700' : prizeValidation.totalPercent > 100 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
            }`}>
              Summe: {prizeValidation.totalPercent}%
              {prizeValidation.totalPercent < 100 && ` (${(100 - prizeValidation.totalPercent)}% nicht vergeben)`}
            </div>
          </div>

          <button onClick={handleSaveGeneral}
            className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">
            💾 Preisgeld-Einstellungen speichern
          </button>
        </div>
      )}

      {/* ============ SPIELER ============ */}
      {activeTab === 'players' && (
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          {scoresExist && (() => {
            const seriesWithScores = tournament.series
              .filter((s) => s.tables.some((t) => t.games.some((g) => Object.values(g.scores).some((v) => v !== null && v !== undefined))))
              .map((s) => `Serie ${s.seriesNumber}${s.completed ? ' ✓' : ''}`);
            return (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-sm text-amber-700 space-y-3">
                <div>
                  <strong>⚠️ Ergebnisse vorhanden</strong>
                  <span className="ml-2 text-xs">({seriesWithScores.join(', ')})</span>
                </div>
                <p>Spielerliste und Serienplan können nicht mehr geändert werden, solange Ergebnisse eingetragen sind.</p>
                <button
                  onClick={() => {
                    if (confirm('Alle Ergebnisse wirklich zurücksetzen?\nDer Tischplan wird neu erstellt. Alle Punkte gehen verloren!')) {
                      resetAllScores();
                    }
                  }}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 transition-colors"
                >
                  🔄 Alle Ergebnisse zurücksetzen
                </button>
              </div>
            );
          })()}

          {canEditPlayers && (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Anzahl Serien</label>
                  <input type="number" min={1} max={20} value={seriesCount}
                    onChange={(e) => setSeriesCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Spiele pro Serie</label>
                  <input type="number" min={1} max={100} value={gamesPerSeries}
                    onChange={(e) => setGamesPerSeries(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
              </div>

              <div className={`text-sm p-3 rounded-lg ${
                players.length < 3 ? 'bg-red-50 text-red-700' : numByes > 0 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
              }`}>
                {players.length < 3
                  ? `Mindestens 3 Spieler benötigt (aktuell: ${players.length})`
                  : numByes > 0
                    ? `${players.length} Spieler → ${Math.floor(players.length / 3)} Tische, ${numByes} Aussetzer pro Serie`
                    : `${players.length} Spieler → ${players.length / 3} Tische, keine Aussetzer`}
              </div>

              <div className="flex gap-2">
                <input type="text" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPlayer()} placeholder="Spielername"
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                <input type="text" value={newPlayerClub} onChange={(e) => setNewPlayerClub(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPlayer()} placeholder="Verein"
                  className="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hidden sm:block" />
                <button onClick={addPlayer} disabled={!newPlayerName.trim()}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-bold">+</button>
              </div>
            </>
          )}

          <div className="space-y-1 max-h-96 overflow-y-auto">
            {players.map((player, idx) => (
              <div key={player.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <span className="w-6 text-xs text-gray-400 text-right shrink-0">{idx + 1}.</span>
                {editingId === player.id && canEditPlayers ? (
                  <>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                      className="flex-1 px-2 py-1 border rounded text-sm" autoFocus />
                    <input type="text" value={editClub} onChange={(e) => setEditClub(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit()} placeholder="Verein"
                      className="w-28 px-2 py-1 border rounded text-sm hidden sm:block" />
                    <button onClick={saveEdit} className="px-2 py-1 text-sm bg-emerald-600 text-white rounded">✓</button>
                    <button onClick={() => setEditingId(null)} className="px-2 py-1 text-sm bg-gray-300 rounded">✕</button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium text-sm truncate">{player.name}</span>
                    {player.club && <span className="text-xs text-gray-500 hidden sm:inline truncate max-w-[120px]">{player.club}</span>}
                    {canEditPlayers && (
                      <>
                        <button onClick={() => startEdit(player)} className="px-2 py-1 text-sm text-gray-400 hover:text-emerald-600" title="Bearbeiten">✎</button>
                        <button onClick={() => removePlayer(player.id)} className="px-2 py-1 text-sm text-gray-400 hover:text-red-600" title="Entfernen">✕</button>
                      </>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {canEditPlayers && (
            <button onClick={handleSavePlayers} disabled={players.length < 3}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              🔄 Spieler speichern &amp; Tischplan neu erstellen
            </button>
          )}
        </div>
      )}

      {/* ============ REGELN ============ */}
      {activeTab === 'rules' && (
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Turnier-Regeln / Hinweise</label>
            <textarea value={houseRules} onChange={(e) => setHouseRules(e.target.value)}
              placeholder="z.B. Gespielt wird nach DSkV-Regeln.&#10;Ramsch wird gespielt.&#10;Kontra/Re erlaubt."
              rows={6}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm" />
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-blue-700">
            <strong>ℹ️ Aussetzer-Regelung (automatisch):</strong><br />
            Aussetzer erhalten als Serienwert den arithmetischen Durchschnitt aller
            Serien-Summen der aktiv spielenden Spieler dieser Serie.
            Bei mehreren Aussetzern erhalten alle denselben Durchschnitt.
          </div>

          <button onClick={handleSaveGeneral}
            className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">
            💾 Regeln speichern
          </button>
        </div>
      )}
    </div>
  );
}
