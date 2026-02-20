'use client';

import { Tournament, Series } from '@/types';

interface Props {
  tournament: Tournament;
  series: Series;
}

export default function PrintTableCards({ tournament, series }: Props) {
  const playerName = (id: string) =>
    tournament.players.find((p) => p.id === id)?.name ?? '?';

  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) {
      alert('Popup blockiert. Bitte erlaube Popups fuer diese Seite.');
      return;
    }

    const tableCards = series.tables
      .map((table) => {
        const players = table.playerIds.map((pid, idx) => ({
          letter: String.fromCharCode(65 + idx),
          name: playerName(pid),
          firstName: playerName(pid).split(' ')[0],
        }));

        const rows = Array.from(
          { length: tournament.gamesPerSeries },
          (_, i) => i + 1,
        );

        return `
        <div class="table-card">
          <div class="table-header">
            <div class="table-title">Tisch ${table.tableNumber}</div>
            <div class="table-sub">Serie ${series.seriesNumber}</div>
          </div>
          <div class="players">
            ${players
              .map(
                (p) => `
              <div class="player-row">
                <span class="player-letter">${p.letter}</span>
                <span class="player-name">${p.name}</span>
              </div>`,
              )
              .join('')}
          </div>
          <table class="score-grid">
            <thead>
              <tr>
                <th class="col-num">#</th>
                ${players.map((p) => `<th>${p.firstName}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (n) => `
                <tr>
                  <td class="col-num">${n}</td>
                  ${players.map(() => '<td>&nbsp;</td>').join('')}
                </tr>`,
                )
                .join('')}
              <tr class="sum-row">
                <td class="col-num">&Sigma;</td>
                ${players.map(() => '<td>&nbsp;</td>').join('')}
              </tr>
            </tbody>
          </table>
        </div>`;
      })
      .join('');

    const byeHtml =
      series.byePlayerIds.length > 0
        ? `<div class="bye-box">
             <strong>Aussetzer:</strong>
             ${series.byePlayerIds.map((pid) => playerName(pid)).join(', ')}
           </div>`
        : '';

    const dateStr = new Date(
      tournament.date + 'T00:00:00',
    ).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const locationStr = tournament.location
      ? ` &middot; ${tournament.location}`
      : '';

    w.document.write(`<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>Tischkarten - Serie ${series.seriesNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: system-ui, -apple-system, sans-serif;
    padding: 1.5cm;
    color: #1a1a1a;
  }
  .header {
    text-align: center;
    border-bottom: 2px solid #333;
    padding-bottom: 12px;
    margin-bottom: 24px;
  }
  .header h1 { font-size: 22px; font-weight: 800; }
  .header p { font-size: 12px; color: #555; margin-top: 4px; }
  .header .series-title { font-size: 16px; font-weight: 700; margin-top: 8px; }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .table-card {
    border: 2px solid #333;
    border-radius: 8px;
    padding: 12px;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .table-header {
    text-align: center;
    border-bottom: 1px solid #999;
    padding-bottom: 8px;
    margin-bottom: 8px;
  }
  .table-title { font-size: 16px; font-weight: 800; }
  .table-sub { font-size: 10px; color: #777; }
  .players { margin-bottom: 8px; }
  .player-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 3px 0;
  }
  .player-letter {
    width: 22px; height: 22px;
    background: #e5e7eb;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700;
    flex-shrink: 0;
  }
  .player-name { font-size: 13px; font-weight: 600; }
  .score-grid {
    width: 100%;
    border-collapse: collapse;
    font-size: 10px;
    margin-top: 4px;
  }
  .score-grid th {
    background: #f3f4f6;
    font-weight: 700;
    text-align: center;
    padding: 3px 4px;
    border: 1px solid #d1d5db;
  }
  .score-grid td {
    text-align: center;
    padding: 2px 4px;
    border: 1px solid #e5e7eb;
    height: 18px;
    min-width: 50px;
  }
  .score-grid .col-num {
    width: 26px; min-width: 26px;
    font-weight: 600;
    background: #f9fafb;
  }
  .score-grid .sum-row { border-top: 2px solid #333; }
  .score-grid .sum-row td { font-weight: 700; height: 22px; }
  .bye-box {
    margin-top: 20px;
    border: 1px solid #999;
    border-radius: 6px;
    padding: 10px 14px;
    font-size: 13px;
    break-inside: avoid;
  }
  .actions {
    text-align: center;
    margin-top: 24px;
  }
  .actions button {
    padding: 10px 32px;
    font-size: 14px;
    font-weight: 700;
    background: #059669;
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
  }
  .actions button:hover { background: #047857; }
  @media print {
    body { padding: 0; }
    .actions { display: none !important; }
  }
</style>
</head>
<body>
  <div class="header">
    <h1>${tournament.name}</h1>
    <p>${dateStr}${locationStr}</p>
    <div class="series-title">Serie ${series.seriesNumber} &mdash; ${tournament.gamesPerSeries} Spiele</div>
  </div>
  <div class="grid">
    ${tableCards}
  </div>
  ${byeHtml}
  <div class="actions">
    <button onclick="window.print()">Drucken</button>
  </div>
</body>
</html>`);
    w.document.close();
  };

  return (
    <button
      onClick={handlePrint}
      className="print:hidden px-4 py-2 bg-gray-700 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
    >
      <span className="text-base">🖨️</span>
      Tischkarten drucken
    </button>
  );
}
