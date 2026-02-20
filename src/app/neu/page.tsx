'use client';

import SetupWizard from '@/components/SetupWizard';
import Link from 'next/link';

export default function NewTournamentPage() {
  return (
    <div className="max-w-3xl mx-auto p-4 pt-8">
      <Link href="/" className="text-sm text-emerald-600 hover:underline">
        ← Zur Turnierliste
      </Link>
      <div className="text-center mb-8 mt-4">
        <h1 className="text-3xl font-bold text-emerald-800 mb-2">
          🃏 Neues Turnier anlegen
        </h1>
      </div>
      <SetupWizard />
    </div>
  );
}
