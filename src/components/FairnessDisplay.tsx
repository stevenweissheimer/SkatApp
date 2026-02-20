'use client';

import { FairnessReport } from '@/types';

interface Props {
  report: FairnessReport;
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 75 ? 'from-emerald-400 to-emerald-500' :
    score >= 50 ? 'from-amber-400 to-amber-500' :
    'from-red-400 to-red-500';

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-xl font-extrabold tabular-nums ${
        score >= 75 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-600'
      }`}>
        {score}
      </span>
    </div>
  );
}

export default function FairnessDisplay({ report }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚖️</span>
          <h3 className="font-bold text-gray-800">Fairness-Analyse</h3>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
          report.overallScore >= 75
            ? 'bg-emerald-100 text-emerald-700'
            : report.overallScore >= 50
              ? 'bg-amber-100 text-amber-700'
              : 'bg-red-100 text-red-700'
        }`}>
          {report.overallScore >= 75 ? 'Gute Verteilung' : report.overallScore >= 50 ? 'Akzeptabel' : 'Verbesserungswürdig'}
        </span>
      </div>

      <div className="p-5 space-y-4">
        <ScoreBar score={report.overallScore} />

        {/* Statistiken */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Paar-Wiederholung</span>
            <p className="font-bold text-lg mt-0.5">
              max. {report.maxPairRepetition}×
              {report.maxPairRepetition <= 1 ? (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-xs ml-2">✓</span>
              ) : (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-500 text-xs ml-2">!</span>
              )}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Aussetzer</span>
            <p className="font-bold text-lg mt-0.5">
              {report.byeEvenness === 'good' && (
                <span className="text-emerald-600">Gleichmäßig ✓</span>
              )}
              {report.byeEvenness === 'fair' && (
                <span className="text-amber-600">Akzeptabel</span>
              )}
              {report.byeEvenness === 'poor' && (
                <span className="text-red-600">Ungleich ⚠</span>
              )}
              {Object.keys(report.byeDistribution).length > 0 &&
                Object.values(report.byeDistribution).every((v) => v === 0) && (
                  <span className="text-gray-500">–</span>
                )}
            </p>
          </div>
        </div>

        {/* Warnungen */}
        {report.warnings.length > 0 ? (
          <div className="space-y-1.5">
            {report.warnings.map((w, i) => (
              <div
                key={i}
                className="text-sm text-amber-700 bg-amber-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-amber-100"
              >
                <span className="shrink-0">⚠</span> {w}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-xl flex items-center gap-2 border border-emerald-100">
            <span className="shrink-0">✓</span> Keine Auffälligkeiten – gute Verteilung!
          </div>
        )}
      </div>
    </div>
  );
}
