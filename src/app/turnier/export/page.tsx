'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTournamentStore } from '@/store/tournament-store';
import ExportImport from '@/components/ExportImport';

export default function ExportPage() {
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

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div>
        <Link
          href="/turnier"
          className="text-sm text-emerald-600 hover:underline"
        >
          ← Übersicht
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-1">
          💾 Export &amp; Import
        </h1>
      </div>

      <ExportImport tournament={tournament} />
    </div>
  );
}
