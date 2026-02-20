'use client';

import { Tournament } from '@/types';
import { getLeaderboard } from '@/lib/scoring';
import { deleteTournament } from '@/lib/api';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  tournament: Tournament;
  tournamentId: string;
}

export default function ExportImport({ tournament, tournamentId }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  /* ---- JSON Export ---- */
  const handleJsonExport = () => {
    const json = JSON.stringify(tournament, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tournament.name.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, '_')}_${tournament.date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---- JSON Import ---- */
  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);

        // Basis-Validierung
        if (!data.name || !data.players || !data.series) {
          alert(
            'Ungültige Datei: Die JSON-Datei enthält kein gültiges Turnier.',
          );
          return;
        }

        alert('Import in der Server-Version: Bitte erstelle ein neues Turnier über "Neues Turnier anlegen".');
      } catch {
        alert('Fehler beim Lesen der Datei. Bitte eine gültige JSON-Datei verwenden.');
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ---- CSV Export ---- */
  const handleCsvExport = () => {
    const entries = getLeaderboard(tournament);
    const header = [
      'Platz',
      'Name',
      'Verein',
      ...tournament.series.map((s) => `Serie ${s.seriesNumber}`),
      'Gesamt',
    ];

    const rows = entries.map((e) => [
      e.rank,
      `"${e.player.name}"`,
      `"${e.player.club}"`,
      ...e.seriesResults.map(
        (sr) => `${sr.total}${sr.isBye ? ' (Ø)' : ''}`,
      ),
      e.grandTotal,
    ]);

    const csv = [header.join(';'), ...rows.map((r) => r.join(';'))].join(
      '\n',
    );
    const bom = '\uFEFF'; // BOM for Excel
    const blob = new Blob([bom + csv], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tournament.name.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, '_')}_Rangliste.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---- Reset ---- */
  const handleReset = async () => {
    if (
      confirm(
        'Turnier wirklich löschen?\nAlle Daten gehen verloren. Erstelle vorher einen JSON-Export!',
      )
    ) {
      await deleteTournament(tournamentId);
      router.push('/');
    }
  };

  return (
    <div className="space-y-6">
      {/* Export */}
      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Export</h2>

        <div className="grid sm:grid-cols-2 gap-3">
          <button
            onClick={handleJsonExport}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            💾 JSON Export (Turnier-Daten)
          </button>
          <button
            onClick={handleCsvExport}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            📊 CSV Export (Rangliste)
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Der JSON-Export enthält alle Turnierdaten und kann zum Importieren /
          Teilen verwendet werden. Der CSV-Export enthält die Rangliste und
          kann in Excel geöffnet werden.
        </p>
      </div>

      {/* Import */}
      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Import</h2>
        <p className="text-sm text-gray-600">
          Lade ein zuvor exportiertes Turnier aus einer JSON-Datei. Das
          aktuelle Turnier wird dabei überschrieben.
        </p>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleJsonImport}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0 file:text-sm file:font-semibold
              file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100
              cursor-pointer"
          />
        </div>
      </div>

      {/* Turnier löschen */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-red-700">Gefahrenzone</h2>
        <p className="text-sm text-gray-600">
          Löscht das Turnier unwiderruflich von der Datenbank. Erstelle vorher einen JSON-Export!
        </p>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          🗑️ Turnier löschen
        </button>
      </div>
    </div>
  );
}
