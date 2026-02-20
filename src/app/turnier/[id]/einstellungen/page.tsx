'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useTournament } from '@/hooks/use-tournament';
import { useTournamentStore, hasAnyScores } from '@/store/tournament-store';
import { PrizePreset, PrizeRule, Player } from '@/types';
import { getDefaultPrizeRules } from '@/lib/prizes';
import { setStoredPassword, clearStoredPassword } from '@/lib/api';

export default function SettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { tournament, loading } = useTournament(id);
  const updateSettings = useTournamentStore((s) => s.updateSettings);

  const [tab, setTab] = useState<'allgemein' | 'struktur' | 'spieler' | 'preise' | 'regeln' | 'sicherheit'>('allgemein');
  const [saving, setSaving] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);

  // Local form state
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [seriesCount, setSeriesCount] = useState(2);
  const [gamesPerSeries, setGamesPerSeries] = useState(24);
  const [entryFee, setEntryFee] = useState(0);
  const [extraPrizePool, setExtraPrizePool] = useState(0);
  const [prizePreset, setPrizePreset] = useState<PrizePreset>('top3');
  const [prizeRules, setPrizeRules] = useState<PrizeRule[]>([]);
  const [houseRules, setHouseRules] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [organizerContact, setOrganizerContact] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Sync local state when tournament loads
  useEffect(() => {
    if (tournament) {
      setName(tournament.name);
      setDate(tournament.date);
      setLocation(tournament.location);
      setSeriesCount(tournament.seriesCount);
      setGamesPerSeries(tournament.gamesPerSeries);
      setEntryFee(tournament.entryFee);
      setExtraPrizePool(tournament.extraPrizePool);
      setPrizePreset(tournament.prizePreset);
      setPrizeRules(tournament.prizeRules ?? []);
      setHouseRules(tournament.houseRules);
      setOrganizerName(tournament.organizerName);
      setOrganizerContact(tournament.organizerContact);
      setPlayers(tournament.players.map((p) => ({ ...p })));
    }
  }, [tournament]);

  if (loading || !tournament) {
    return (
      <div className="max-w-4xl mx-auto p-4 pt-8">
        <div className="animate-pulse text-center py-20 text-gray-400">
          Einstellungen laden…
        </div>
      </div>
    );
  }

  const tournamentStarted = tournament ? hasAnyScores(tournament) : false;
  const structuralChanged = tournament
    ? seriesCount !== tournament.seriesCount || gamesPerSeries !== tournament.gamesPerSeries
    : false;

  const handleSave = async () => {
    if (structuralChanged) {
      if (
        !confirm(
          'Achtung: Anzahl Serien oder Spiele pro Serie wurde geändert.\n\n' +
          'Die Tischplanung wird komplett NEU generiert und alle bisherigen Zuordnungen gehen verloren.\n\n' +
          'Fortfahren?',
        )
      ) {
        return;
      }
    }
    setSaving(true);
    try {
      await updateSettings({
        name,
        date,
        location,
        seriesCount,
        gamesPerSeries,
        entryFee,
        extraPrizePool,
        prizePreset,
        prizeRules,
        houseRules,
        organizerName,
        organizerContact,
        players,
      });
      alert('Einstellungen gespeichert!');
    } catch (e: any) {
      alert('Fehler: ' + (e.message || 'Speichern fehlgeschlagen'));
    }
    setSaving(false);
  };

  const handlePresetChange = (preset: PrizePreset) => {
    setPrizePreset(preset);
    if (preset !== 'custom') {
      setPrizeRules(getDefaultPrizeRules(preset));
    }
  };

  const addCustomRule = () => {
    const nextPlace = prizeRules.length > 0 ? Math.max(...prizeRules.map((r) => r.place)) + 1 : 1;
    setPrizeRules([...prizeRules, { place: nextPlace, percent: 0 }]);
  };

  const removeRule = (idx: number) => {
    setPrizeRules(prizeRules.filter((_, i) => i !== idx));
  };

  const updateRule = (idx: number, field: 'place' | 'percent', value: number) => {
    setPrizeRules(prizeRules.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const tabs = [
    { key: 'allgemein' as const, label: 'Allgemein', icon: '📋' },
    { key: 'struktur' as const, label: 'Struktur', icon: '🎯' },
    { key: 'spieler' as const, label: 'Spieler', icon: '👥' },
    { key: 'preise' as const, label: 'Preise', icon: '💰' },
    { key: 'regeln' as const, label: 'Regeln', icon: '📜' },
    { key: 'sicherheit' as const, label: 'Passwort', icon: '🔒' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 pt-6 space-y-6">
      <div>
        <Link
          href={`/turnier/${id}`}
          className="text-emerald-600 text-sm hover:underline mb-1 inline-flex items-center gap-1"
        >
          ← Übersicht
        </Link>
        <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-3">
          <span className="text-3xl">⚙️</span>
          Einstellungen
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-t-xl text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-white border border-b-white border-gray-200 -mb-[2px] text-emerald-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-5">
        {tab === 'allgemein' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Turniername
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Datum
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ort
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Turnierleiter
              </label>
              <input
                type="text"
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Name des Turnierleiters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kontakt
              </label>
              <input
                type="text"
                value={organizerContact}
                onChange={(e) => setOrganizerContact(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Tel. / E-Mail"
              />
            </div>
          </>
        )}

        {tab === 'struktur' && (
          <>
            {tournamentStarted && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-amber-700 font-medium">
                  ⚠️ Das Turnier hat bereits begonnen (Punkte wurden eingetragen). Serien und Spiele pro Serie können nicht mehr geändert werden.
                </p>
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Anzahl Serien
                </label>
                <input
                  type="number"
                  value={seriesCount}
                  onChange={(e) => setSeriesCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                  min={1}
                  max={20}
                  disabled={tournamentStarted}
                />
                <p className="text-xs text-gray-400 mt-1">Üblich: 2 Serien für ein Tagesturnier</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spiele pro Serie
                </label>
                <input
                  type="number"
                  value={gamesPerSeries}
                  onChange={(e) => setGamesPerSeries(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                  min={1}
                  max={99}
                  disabled={tournamentStarted}
                />
                <p className="text-xs text-gray-400 mt-1">Üblich: 24 oder 36 Spiele pro Serie</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Einsatz pro Person (€)
              </label>
              <input
                type="number"
                value={entryFee}
                onChange={(e) => setEntryFee(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                min={0}
                step={0.5}
              />
            </div>
            {structuralChanged && !tournamentStarted && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-700 font-medium">
                  ℹ️ Serien-/Spielanzahl geändert – beim Speichern wird die Tischplanung neu generiert.
                </p>
              </div>
            )}
          </>
        )}

        {tab === 'spieler' && (
          <>
            <div className="mb-3">
              <p className="text-sm text-gray-500">
                Spielernamen, Verein und Notizen bearbeiten. Die Tischplanung bleibt bestehen.
              </p>
            </div>
            <div className="space-y-3">
              {players.map((player, idx) => (
                <div
                  key={player.id}
                  className="flex flex-col sm:flex-row gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="flex items-center gap-2 sm:w-8 shrink-0">
                    <span className="text-xs font-bold text-gray-400">{idx + 1}</span>
                  </div>
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => {
                      const updated = [...players];
                      updated[idx] = { ...updated[idx], name: e.target.value };
                      setPlayers(updated);
                    }}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Name"
                  />
                  <input
                    type="text"
                    value={player.club}
                    onChange={(e) => {
                      const updated = [...players];
                      updated[idx] = { ...updated[idx], club: e.target.value };
                      setPlayers(updated);
                    }}
                    className="sm:w-40 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Verein"
                  />
                  <input
                    type="text"
                    value={player.note}
                    onChange={(e) => {
                      const updated = [...players];
                      updated[idx] = { ...updated[idx], note: e.target.value };
                      setPlayers(updated);
                    }}
                    className="sm:w-40 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Notiz"
                  />
                </div>
              ))}
            </div>
            {players.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Keine Spieler vorhanden.</p>
            )}
          </>
        )}

        {tab === 'preise' && (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Startgeld (€)
                </label>
                <input
                  type="number"
                  value={entryFee}
                  onChange={(e) => setEntryFee(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  min={0}
                  step={0.5}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zusätzlicher Preispool (€)
                </label>
                <input
                  type="number"
                  value={extraPrizePool}
                  onChange={(e) => setExtraPrizePool(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  min={0}
                  step={0.5}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preisverteilung
              </label>
              <div className="flex gap-2 flex-wrap">
                {(['top3', 'top5', 'top10', 'custom'] as PrizePreset[]).map(
                  (preset) => (
                    <button
                      key={preset}
                      onClick={() => handlePresetChange(preset)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        prizePreset === preset
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {preset === 'custom' ? 'Eigene' : `Top ${preset.replace('top', '')}`}
                    </button>
                  ),
                )}
              </div>
            </div>
            {/* Prize Rules Table */}
            {prizeRules.length > 0 && (
              <div className="space-y-2">
                {prizeRules.map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500 w-16">
                      Platz {rule.place}
                    </span>
                    <input
                      type="number"
                      value={rule.percent}
                      onChange={(e) =>
                        updateRule(idx, 'percent', parseFloat(e.target.value) || 0)
                      }
                      className="w-24 px-3 py-1.5 border rounded-lg text-sm text-center"
                      min={0}
                      max={100}
                      step={0.5}
                      disabled={prizePreset !== 'custom'}
                    />
                    <span className="text-sm text-gray-500">%</span>
                    {prizePreset === 'custom' && (
                      <button
                        onClick={() => removeRule(idx)}
                        className="text-red-400 hover:text-red-600 text-sm"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {prizePreset === 'custom' && (
                  <button
                    onClick={addCustomRule}
                    className="text-sm text-emerald-600 hover:underline"
                  >
                    + Platz hinzufügen
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {tab === 'regeln' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Turnierregeln / Hausregeln
              </label>
              <textarea
                value={houseRules}
                onChange={(e) => setHouseRules(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent h-40 resize-y"
                placeholder="z.B. Ramsch-Regeln, Bockrunden, etc."
              />
            </div>
          </>
        )}

        {tab === 'sicherheit' && (
          <>
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🔒</span>
                <div>
                  <h3 className="font-semibold text-gray-800">Passwortschutz</h3>
                  <p className="text-sm text-gray-500">
                    {tournament.hasPassword
                      ? 'Dieses Turnier ist passwortgeschützt.'
                      : 'Dieses Turnier ist nicht geschützt.'}
                  </p>
                </div>
              </div>

              {tournament.hasPassword && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                  ⚠️ Das Turnier hat aktuell ein Passwort. Gib ein neues Passwort ein um es zu ändern,
                  oder klicke &quot;Passwort entfernen&quot; um den Schutz aufzuheben.
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tournament.hasPassword ? 'Neues Passwort' : 'Passwort setzen'}
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={tournament.hasPassword ? 'Neues Passwort eingeben…' : 'Passwort eingeben…'}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {newPassword.trim() && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Passwort bestätigen
                  </label>
                  <input
                    type="text"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Passwort wiederholen…"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  {confirmPassword && newPassword.trim() !== confirmPassword.trim() && (
                    <p className="text-red-500 text-xs mt-1">Passwörter stimmen nicht überein</p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {newPassword.trim() && newPassword.trim() === confirmPassword.trim() && (
                  <button
                    onClick={async () => {
                      setSaving(true);
                      try {
                        await updateSettings({ password: newPassword.trim() } as any);
                        setStoredPassword(id, newPassword.trim());
                        setNewPassword('');
                        setConfirmPassword('');
                        alert('Passwort wurde gesetzt!');
                      } catch (e: any) {
                        alert('Fehler: ' + e.message);
                      }
                      setSaving(false);
                    }}
                    disabled={saving}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Speichern…' : '🔒 Passwort setzen'}
                  </button>
                )}

                {tournament.hasPassword && (
                  <button
                    onClick={async () => {
                      if (!confirm('Passwortschutz wirklich entfernen?\nDas Turnier ist dann für alle zugänglich.')) return;
                      setSaving(true);
                      try {
                        await updateSettings({ password: '' } as any);
                        clearStoredPassword(id);
                        setNewPassword('');
                        setConfirmPassword('');
                        alert('Passwort wurde entfernt!');
                      } catch (e: any) {
                        alert('Fehler: ' + e.message);
                      }
                      setSaving(false);
                    }}
                    disabled={saving}
                    className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    🗑️ Passwort entfernen
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="pt-4 border-t">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-sm disabled:opacity-50"
          >
            {saving ? 'Speichern…' : '💾 Einstellungen speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}
