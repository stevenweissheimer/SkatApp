'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useTournament } from '@/hooks/use-tournament';
import { useTournamentStore, hasAnyScores } from '@/store/tournament-store';
import { PrizePreset, PrizeRule } from '@/types';
import { getDefaultPrizeRules } from '@/lib/prizes';

export default function SettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { tournament, loading } = useTournament(id);
  const updateSettings = useTournamentStore((s) => s.updateSettings);

  const [tab, setTab] = useState<'allgemein' | 'preise' | 'regeln'>('allgemein');
  const [saving, setSaving] = useState(false);

  // Local form state
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

  // Sync local state when tournament loads
  useEffect(() => {
    if (tournament) {
      setName(tournament.name);
      setDate(tournament.date);
      setLocation(tournament.location);
      setEntryFee(tournament.entryFee);
      setExtraPrizePool(tournament.extraPrizePool);
      setPrizePreset(tournament.prizePreset);
      setPrizeRules(tournament.prizeRules ?? []);
      setHouseRules(tournament.houseRules);
      setOrganizerName(tournament.organizerName);
      setOrganizerContact(tournament.organizerContact);
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

  const handleSave = async () => {
    setSaving(true);
    await updateSettings({
      name,
      date,
      location,
      entryFee,
      extraPrizePool,
      prizePreset,
      prizeRules,
      houseRules,
      organizerName,
      organizerContact,
    });
    setSaving(false);
    alert('Einstellungen gespeichert!');
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
    { key: 'preise' as const, label: 'Preise', icon: '💰' },
    { key: 'regeln' as const, label: 'Regeln', icon: '📜' },
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
