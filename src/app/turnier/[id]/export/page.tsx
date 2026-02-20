'use client';

import { use } from 'react';
import Link from 'next/link';
import { useTournament } from '@/hooks/use-tournament';
import ExportImport from '@/components/ExportImport';

export default function ExportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { tournament, loading } = useTournament(id);

  if (loading || !tournament) {
    return (
      <div className="max-w-4xl mx-auto p-4 pt-8">
        <div className="animate-pulse text-center py-20 text-gray-400">
          Export laden…
        </div>
      </div>
    );
  }

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
          <span className="text-3xl">💾</span>
          Export / Import
        </h1>
      </div>
      <ExportImport tournament={tournament} tournamentId={id} />
    </div>
  );
}
