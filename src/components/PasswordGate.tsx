'use client';

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { verifyPassword, getStoredPassword, getStoredScoreToken, setStoredScoreToken } from '@/lib/api';

interface PasswordGateProps {
  tournamentId: string;
  children: ReactNode;
}

/**
 * Wraps tournament pages. If the tournament requires a password and
 * the user hasn't entered it yet (or it's wrong), shows a password prompt.
 * Once verified, the password is stored in sessionStorage and children are rendered.
 *
 * If a ?token=... query parameter is present, it is stored as a score token
 * and the password prompt is bypassed (for QR-Code access on mobile).
 */
export default function PasswordGate({ tournamentId, children }: PasswordGateProps) {
  const [state, setState] = useState<'checking' | 'needs-password' | 'ok'>('checking');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Prüfe ob ein Score-Token in der URL ist (QR-Code-Zugang)
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setStoredScoreToken(tournamentId, urlToken);
      setState('ok');
      return;
    }

    // Prüfe ob wir schon einen gespeicherten Score-Token haben
    const storedToken = getStoredScoreToken(tournamentId);
    if (storedToken) {
      setState('ok');
      return;
    }

    // Prüfe ob wir schon ein gespeichertes Passwort haben das funktioniert
    const stored = getStoredPassword(tournamentId);
    if (stored) {
      // Verify the stored password still works
      verifyPassword(tournamentId, stored).then((ok) => {
        setState(ok ? 'ok' : 'needs-password');
      });
    } else {
      // Check if tournament needs a password at all
      fetch(`/api/tournaments/${tournamentId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: '' }),
      }).then((res) => {
        if (res.ok) {
          // No password needed
          setState('ok');
        } else {
          setState('needs-password');
        }
      }).catch(() => {
        // If verify fails, try loading anyway
        setState('ok');
      });
    }
  }, [tournamentId, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setVerifying(true);
    setError('');

    const ok = await verifyPassword(tournamentId, password.trim());
    if (ok) {
      setState('ok');
    } else {
      setError('Falsches Passwort');
    }
    setVerifying(false);
  };

  if (state === 'checking') {
    return (
      <div className="max-w-md mx-auto p-4 pt-20 text-center">
        <div className="animate-pulse text-gray-400">Zugriff prüfen…</div>
      </div>
    );
  }

  if (state === 'needs-password') {
    return (
      <div className="max-w-md mx-auto p-4 pt-12">
        <div className="bg-white rounded-2xl shadow-lg border p-8 text-center space-y-6">
          <div className="text-6xl">🔒</div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              Passwortgeschütztes Turnier
            </h2>
            <p className="text-sm text-gray-500">
              Bitte gib das Turnier-Passwort ein, um fortzufahren.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Passwort eingeben…"
                autoFocus
                className="w-full px-4 py-3 text-center text-lg border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
              {error && (
                <p className="text-red-500 text-sm mt-2 font-medium">{error}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={verifying || !password.trim()}
              className="w-full px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {verifying ? 'Prüfe…' : '🔓 Zugang freischalten'}
            </button>
          </form>

          <Link
            href="/"
            className="inline-block text-sm text-gray-400 hover:text-emerald-600 transition-colors"
          >
            ← Zurück zur Turnierliste
          </Link>
        </div>
      </div>
    );
  }

  // state === 'ok'
  return <>{children}</>;
}
