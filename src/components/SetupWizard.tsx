'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentStore } from '@/store/tournament-store';
import { Player, PrizeRule, PrizePreset } from '@/types';
import { getDefaultPrizeRules, validatePrizeRules } from '@/lib/prizes';

function generateId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).substring(2)
  );
}

export default function SetupWizard() {
  const router = useRouter();
  const createAndGenerate = useTournamentStore((s) => s.createAndGenerate);

  const [step, setStep] = useState(1);

  // Schritt 1 – Turnier-Info
  const [name, setName] = useState('');
  const [date, setDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [location, setLocation] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [organizerContact, setOrganizerContact] = useState('');

  // Schritt 2 – Einstellungen
  const [seriesCount, setSeriesCount] = useState(2);
  const [gamesPerSeries, setGamesPerSeries] = useState(24);
  const [entryFee, setEntryFee] = useState(0);
  const [extraPrizePool, setExtraPrizePool] = useState(0);
  const [prizePreset, setPrizePreset] = useState<PrizePreset>('top3');
  const [prizeRules, setPrizeRules] = useState<PrizeRule[]>(getDefaultPrizeRules('top3'));
  const [houseRules, setHouseRules] = useState('');

  // Schritt 3 – Spieler
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerClub, setNewPlayerClub] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editClub, setEditClub] = useState('');

  const numByes = players.length >= 3 ? players.length % 3 : 0;

  /* ---- Spieler-Aktionen ---- */

  const addPlayer = () => {
    const trimmed = newPlayerName.trim();
    if (!trimmed) return;
    setPlayers((prev) => [
      ...prev,
      { id: generateId(), name: trimmed, club: newPlayerClub.trim(), note: '' },
    ]);
    setNewPlayerName('');
    setNewPlayerClub('');
  };

  const bulkAddPlayers = () => {
    const names = bulkInput
      .split('\n')
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    const newPlayers: Player[] = names.map((n) => ({
      id: generateId(),
      name: n,
      club: '',
      note: '',
    }));
    setPlayers((prev) => [...prev, ...newPlayers]);
    setBulkInput('');
    setShowBulkAdd(false);
  };

  const removePlayer = (id: string) =>
    setPlayers((prev) => prev.filter((p) => p.id !== id));

  const startEdit = (player: Player) => {
    setEditingId(player.id);
    setEditName(player.name);
    setEditClub(player.club);
  };

  const saveEdit = () => {
    if (!editingId) return;
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === editingId
          ? { ...p, name: editName.trim() || p.name, club: editClub.trim() }
          : p,
      ),
    );
    setEditingId(null);
  };

  /* ---- Navigation ---- */

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return name.trim().length > 0 && date.length > 0;
      case 2:
        return seriesCount >= 1 && gamesPerSeries >= 1;
      case 3:
        return prizeValidation.valid;
      case 4:
        return players.length >= 3;
      default:
        return true;
    }
  };

  const handleGenerate = () => {
    createAndGenerate({
      name: name.trim(),
      date,
      location: location.trim(),
      seriesCount,
      gamesPerSeries,
      entryFee,
      players,
      prizeRules,
      prizePreset,
      extraPrizePool,
      houseRules: houseRules.trim(),
      organizerName: organizerName.trim(),
      organizerContact: organizerContact.trim(),
    });
    router.push('/turnier');
  };

  /* ---- Preis-Presets ---- */

  const handlePresetChange = (preset: PrizePreset) => {
    setPrizePreset(preset);
    if (preset !== 'custom') {
      setPrizeRules(getDefaultPrizeRules(preset));
    }
  };

  const addPrizeRule = () => {
    const next = prizeRules.length > 0 ? Math.max(...prizeRules.map((r) => r.place)) + 1 : 1;
    setPrizeRules([...prizeRules, { place: next, percent: 0 }]);
  };

  const removePrizeRule = (place: number) => {
    setPrizeRules(prizeRules.filter((r) => r.place !== place));
  };

  const updatePrizeRule = (place: number, percent: number) => {
    setPrizeRules(prizeRules.map((r) => (r.place === place ? { ...r, percent } : r)));
  };

  const prizeValidation = validatePrizeRules(prizeRules);
  const totalPool = entryFee * Math.max(players.length, 1) + extraPrizePool;

  /* ---- Rendering ---- */

  const steps = [
    { num: 1, label: 'Turnier-Info' },
    { num: 2, label: 'Einstellungen' },
    { num: 3, label: 'Preisgeld' },
    { num: 4, label: 'Spieler' },
    { num: 5, label: 'Zusammenfassung' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Schritt-Anzeige */}
      <div className="flex border-b">
        {steps.map((s) => (
          <button
            key={s.num}
            onClick={() => s.num < step && setStep(s.num)}
            className={`flex-1 py-3 px-2 text-sm font-medium text-center transition-colors ${
              step === s.num
                ? 'bg-emerald-50 text-emerald-800 border-b-2 border-emerald-600'
                : step > s.num
                  ? 'text-emerald-600 hover:bg-gray-50 cursor-pointer'
                  : 'text-gray-400 cursor-default'
            }`}
          >
            <span className="hidden sm:inline">{s.label}</span>
            <span className="sm:hidden">{s.num}/5</span>
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* ==================== SCHRITT 1 ==================== */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">
              Turnier-Informationen
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Turniername *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Vereinsmeisterschaft 2026"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Datum *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ort (optional)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="z.B. Vereinsheim"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Turnierleiter (optional)
                </label>
                <input
                  type="text"
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  placeholder="Name"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kontakt (optional)
                </label>
                <input
                  type="text"
                  value={organizerContact}
                  onChange={(e) => setOrganizerContact(e.target.value)}
                  placeholder="Tel. / E-Mail"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* ==================== SCHRITT 2 ==================== */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">
              Turnier-Einstellungen
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anzahl Serien
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={seriesCount}
                onChange={(e) =>
                  setSeriesCount(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Üblich: 2 Serien für ein Tagesturnier
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Spiele pro Serie
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={gamesPerSeries}
                onChange={(e) =>
                  setGamesPerSeries(
                    Math.max(1, parseInt(e.target.value) || 1),
                  )
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Üblich: 24 oder 36 Spiele pro Serie
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Einsatz pro Person (€)
              </label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={entryFee}
                onChange={(e) =>
                  setEntryFee(Math.max(0, parseFloat(e.target.value) || 0))
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Turnier-Regeln / Hinweise (optional)
              </label>
              <textarea
                value={houseRules}
                onChange={(e) => setHouseRules(e.target.value)}
                placeholder="z.B. Gespielt wird nach DSkV-Regeln.&#10;Ramsch wird gespielt."
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              />
            </div>
          </div>
        )}

        {/* ==================== SCHRITT 3: PREISGELD ==================== */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">
              Preisgeld-Verteilung
            </h2>

            <div className="bg-emerald-50 p-4 rounded-lg">
              <div className="text-sm text-emerald-700 font-medium mb-1">Geschätzter Preispool</div>
              <div className="text-2xl font-bold text-emerald-800">
                {totalPool.toFixed(2)} €
              </div>
              <div className="text-xs text-emerald-600 mt-1">
                {entryFee > 0 ? `${entryFee.toFixed(2)} € × Spieler` : 'Kein Einsatz'}
                {extraPrizePool > 0 && ` + ${extraPrizePool.toFixed(2)} € extra`}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zusätzlicher Preispool (€)
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={extraPrizePool}
                onChange={(e) =>
                  setExtraPrizePool(Math.max(0, parseFloat(e.target.value) || 0))
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                z.B. Sponsor-Geld oder Vereinszuschuss
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verteilungsschema
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'top3' as PrizePreset, label: 'Top 3', desc: '50/30/20' },
                  { key: 'top5' as PrizePreset, label: 'Top 5', desc: '35/25/20/12/8' },
                  { key: 'top10' as PrizePreset, label: 'Top 10', desc: '25–2%' },
                  { key: 'custom' as PrizePreset, label: 'Eigenes', desc: 'Frei wählbar' },
                ].map((p) => (
                  <button
                    key={p.key}
                    onClick={() => handlePresetChange(p.key)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      prizePreset === p.key
                        ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{p.label}</div>
                    <div className="text-xs text-gray-500">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preis-Tabelle */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Verteilung {prizePreset !== 'custom' && '(Voreinstellung)'}
              </label>
              {prizeRules.map((rule) => (
                <div key={rule.place} className="flex items-center gap-2">
                  <span className="w-16 text-sm text-gray-600 shrink-0">
                    {rule.place}. Platz
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={rule.percent}
                    onChange={(e) => {
                      updatePrizeRule(rule.place, Math.max(0, parseFloat(e.target.value) || 0));
                      if (prizePreset !== 'custom') setPrizePreset('custom');
                    }}
                    className="w-20 px-2 py-1.5 border rounded-lg text-sm text-center focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-500">%</span>
                  <span className="text-sm text-gray-400 ml-2">
                    ≈ {(totalPool * rule.percent / 100).toFixed(2)} €
                  </span>
                  {prizePreset === 'custom' && (
                    <button
                      onClick={() => removePrizeRule(rule.place)}
                      className="ml-auto text-gray-400 hover:text-red-500 text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              {prizePreset === 'custom' && (
                <button
                  onClick={addPrizeRule}
                  className="text-sm text-emerald-600 hover:text-emerald-700 mt-1"
                >
                  + Platz hinzufügen
                </button>
              )}

              <div className={`text-sm mt-2 p-2 rounded ${
                prizeValidation.totalPercent === 100
                  ? 'bg-green-50 text-green-700'
                  : prizeValidation.totalPercent > 100
                    ? 'bg-red-50 text-red-700'
                    : 'bg-amber-50 text-amber-700'
              }`}>
                Summe: {prizeValidation.totalPercent}%
                {prizeValidation.totalPercent < 100 && ` (${(100 - prizeValidation.totalPercent)}% nicht vergeben)`}
                {prizeValidation.error && ` — ${prizeValidation.error}`}
              </div>
            </div>

            {entryFee === 0 && extraPrizePool === 0 && (
              <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-500">
                ℹ️ Kein Einsatz und kein zusätzlicher Pool → Es wird kein
                Preisgeld verteilt. Die Einstellungen werden trotzdem
                gespeichert, falls du den Einsatz später anpassen möchtest.
              </div>
            )}
          </div>
        )}

        {/* ==================== SCHRITT 4: SPIELER ==================== */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-2">Spieler verwalten</h2>

            {/* BYE-Info */}
            <div
              className={`text-sm p-3 rounded-lg ${
                players.length < 3
                  ? 'bg-red-50 text-red-700'
                  : numByes > 0
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-green-50 text-green-700'
              }`}
            >
              {players.length < 3
                ? `Mindestens 3 Spieler benötigt (aktuell: ${players.length})`
                : numByes > 0
                  ? `${players.length} Spieler → ${Math.floor(players.length / 3)} Tische, ${numByes} Aussetzer pro Serie`
                  : `${players.length} Spieler → ${players.length / 3} Tische, keine Aussetzer`}
            </div>

            {/* Spieler hinzufügen */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                placeholder="Spielername"
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <input
                type="text"
                value={newPlayerClub}
                onChange={(e) => setNewPlayerClub(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                placeholder="Verein (opt.)"
                className="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hidden sm:block"
              />
              <button
                onClick={addPlayer}
                disabled={!newPlayerName.trim()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
              >
                +
              </button>
            </div>

            {/* Bulk-Add */}
            <button
              onClick={() => setShowBulkAdd(!showBulkAdd)}
              className="text-sm text-emerald-600 hover:text-emerald-700"
            >
              {showBulkAdd
                ? '▾ Einzeln hinzufügen'
                : '▸ Mehrere auf einmal hinzufügen'}
            </button>

            {showBulkAdd && (
              <div className="space-y-2">
                <textarea
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder="Ein Name pro Zeile&#10;Hans Müller&#10;Fritz Weber&#10;Karl Schmidt"
                  rows={5}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                />
                <button
                  onClick={bulkAddPlayers}
                  disabled={!bulkInput.trim()}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm"
                >
                  Alle hinzufügen
                </button>
              </div>
            )}

            {/* Spielerliste */}
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {players.map((player, idx) => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                >
                  <span className="w-6 text-xs text-gray-400 text-right shrink-0">
                    {idx + 1}.
                  </span>

                  {editingId === player.id ? (
                    <>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                        className="flex-1 px-2 py-1 border rounded text-sm"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={editClub}
                        onChange={(e) => setEditClub(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                        placeholder="Verein"
                        className="w-28 px-2 py-1 border rounded text-sm hidden sm:block"
                      />
                      <button
                        onClick={saveEdit}
                        className="px-2 py-1 text-sm bg-emerald-600 text-white rounded"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 text-sm bg-gray-300 rounded"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 font-medium text-sm truncate">
                        {player.name}
                      </span>
                      {player.club && (
                        <span className="text-xs text-gray-500 hidden sm:inline truncate max-w-[120px]">
                          {player.club}
                        </span>
                      )}
                      <button
                        onClick={() => startEdit(player)}
                        className="px-2 py-1 text-sm text-gray-400 hover:text-emerald-600"
                        title="Bearbeiten"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => removePlayer(player.id)}
                        className="px-2 py-1 text-sm text-gray-400 hover:text-red-600"
                        title="Entfernen"
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>
              ))}
              {players.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  Noch keine Spieler hinzugefügt
                </p>
              )}
            </div>
          </div>
        )}

        {/* ==================== SCHRITT 5: ZUSAMMENFASSUNG ==================== */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Zusammenfassung</h2>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-500 text-xs">Turnier</span>
                <p className="font-medium">{name}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-500 text-xs">Datum</span>
                <p className="font-medium">
                  {new Date(date + 'T00:00:00').toLocaleDateString('de-DE')}
                </p>
              </div>
              {location && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-gray-500 text-xs">Ort</span>
                  <p className="font-medium">{location}</p>
                </div>
              )}
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-500 text-xs">Serien</span>
                <p className="font-medium">
                  {seriesCount} × {gamesPerSeries} Spiele
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-500 text-xs">Einsatz</span>
                <p className="font-medium">
                  {entryFee > 0
                    ? `${entryFee.toFixed(2)} € / Person`
                    : 'Kein Einsatz'}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-500 text-xs">Preispool</span>
                <p className="font-medium">
                  {totalPool > 0 ? `${totalPool.toFixed(2)} €` : 'Kein Preisgeld'}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-500 text-xs">Spieler</span>
                <p className="font-medium">
                  {players.length} Spieler →{' '}
                  {Math.floor(players.length / 3)} Tische
                  {numByes > 0 && `, ${numByes} Aussetzer/Serie`}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-500 text-xs">Teilnehmer</span>
              <p className="text-sm mt-1">
                {players.map((p) => p.name).join(', ')}
              </p>
            </div>

            {numByes > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
                <strong>ℹ️ Aussetzer-Regelung:</strong> Aussetzer erhalten als
                Serienwert den arithmetischen Durchschnitt aller
                Serien-Summen der aktiv spielenden Spieler dieser Serie. Bei
                mehreren Aussetzern erhalten alle denselben Durchschnitt.
              </div>
            )}

            <button
              onClick={handleGenerate}
              className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors text-lg"
            >
              🎯 Tischplan erstellen & Turnier starten
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-30 disabled:cursor-default"
          >
            ← Zurück
          </button>
          {step < 5 && (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Weiter →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
