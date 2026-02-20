/**
 * Preisgeld-Verteilungslogik
 * ==========================
 *
 * Preispool = (Einsatz × Spieleranzahl) + Zusätzlicher Pool
 *
 * Vordefinierte Schemata:
 *   top3:  1. Platz 50%, 2. Platz 30%, 3. Platz 20%
 *   top5:  1. 35%, 2. 25%, 3. 20%, 4. 12%, 5. 8%
 *   top10: 1. 25%, 2. 18%, 3. 14%, 4. 11%, 5. 9%, 6. 7%, 7. 6%, 8. 5%, 9. 3%, 10. 2%
 *   custom: Frei konfigurierbar
 */

import { PrizeRule, PrizePreset, Tournament, LeaderboardEntry } from '@/types';

export function getDefaultPrizeRules(preset: PrizePreset): PrizeRule[] {
  switch (preset) {
    case 'top3':
      return [
        { place: 1, percent: 50 },
        { place: 2, percent: 30 },
        { place: 3, percent: 20 },
      ];
    case 'top5':
      return [
        { place: 1, percent: 35 },
        { place: 2, percent: 25 },
        { place: 3, percent: 20 },
        { place: 4, percent: 12 },
        { place: 5, percent: 8 },
      ];
    case 'top10':
      return [
        { place: 1, percent: 25 },
        { place: 2, percent: 18 },
        { place: 3, percent: 14 },
        { place: 4, percent: 11 },
        { place: 5, percent: 9 },
        { place: 6, percent: 7 },
        { place: 7, percent: 6 },
        { place: 8, percent: 5 },
        { place: 9, percent: 3 },
        { place: 10, percent: 2 },
      ];
    case 'custom':
      return [
        { place: 1, percent: 50 },
        { place: 2, percent: 30 },
        { place: 3, percent: 20 },
      ];
  }
}

export function getTotalPrizePool(tournament: Tournament): number {
  return (tournament.entryFee ?? 0) * (tournament.players?.length ?? 0) + (tournament.extraPrizePool ?? 0);
}

export function getPrizeForPlace(tournament: Tournament, place: number): number {
  const pool = getTotalPrizePool(tournament);
  const rules = tournament.prizeRules ?? [];
  const rule = rules.find((r) => r.place === place);
  if (!rule) return 0;
  return Math.round((pool * rule.percent) / 100 * 100) / 100;
}

export function getPrizeForEntry(
  tournament: Tournament,
  entry: LeaderboardEntry,
): number {
  return getPrizeForPlace(tournament, entry.rank);
}

export function validatePrizeRules(rules: PrizeRule[]): {
  valid: boolean;
  totalPercent: number;
  error: string | null;
} {
  const totalPercent = rules.reduce((sum, r) => sum + r.percent, 0);
  if (totalPercent > 100) {
    return { valid: false, totalPercent, error: 'Summe übersteigt 100%' };
  }
  if (rules.some((r) => r.percent < 0)) {
    return { valid: false, totalPercent, error: 'Negative Prozente nicht erlaubt' };
  }
  if (rules.some((r) => r.place < 1)) {
    return { valid: false, totalPercent, error: 'Ungültiger Platz' };
  }
  return { valid: true, totalPercent, error: null };
}
