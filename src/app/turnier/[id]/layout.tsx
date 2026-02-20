'use client';

import { use } from 'react';
import PasswordGate from '@/components/PasswordGate';

export default function TournamentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return <PasswordGate tournamentId={id}>{children}</PasswordGate>;
}
