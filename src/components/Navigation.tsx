'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTournamentStore } from '@/store/tournament-store';
import { useEffect, useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const tournament = useTournamentStore((s) => s.tournament);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || !tournament?.planGenerated) return null;

  const links = [
    { href: '/turnier', label: 'Übersicht', icon: '📋' },
    { href: '/turnier/rangliste', label: 'Rangliste', icon: '🏆' },
    { href: '/turnier/einstellungen', label: 'Einstellungen', icon: '⚙️' },
    { href: '/turnier/export', label: 'Export', icon: '💾' },
  ];

  return (
    <nav className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white shadow-xl print:hidden border-b border-emerald-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/turnier"
            className="font-bold text-lg flex items-center gap-3 hover:text-emerald-200 transition-colors group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">🃏</span>
            <div className="hidden sm:block">
              <div className="text-sm font-bold leading-tight truncate max-w-[220px]">
                {tournament.name}
              </div>
              <div className="text-[10px] text-emerald-300 font-normal leading-tight">
                Skat Turnierbuch
              </div>
            </div>
            <span className="sm:hidden font-bold">Skat</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white/20 text-white shadow-inner backdrop-blur-sm'
                      : 'text-emerald-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="text-base">{link.icon}</span>
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
