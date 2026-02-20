'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Props {
  /** Default duration in minutes */
  defaultMinutes?: number;
}

export default function SeriesTimer({ defaultMinutes = 90 }: Props) {
  const [totalSeconds, setTotalSeconds] = useState(defaultMinutes * 60);
  const [remaining, setRemaining] = useState(defaultMinutes * 60);
  const [running, setRunning] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editMin, setEditMin] = useState(defaultMinutes);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Timer tick
  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            setRunning(false);
            // Play alarm sound
            try {
              const ctx = new AudioContext();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.value = 880;
              osc.type = 'square';
              gain.gain.value = 0.3;
              osc.start();
              setTimeout(() => { osc.stop(); ctx.close(); }, 1500);
            } catch {
              // Audio not available
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, remaining]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const percentage = totalSeconds > 0 ? (remaining / totalSeconds) * 100 : 0;

  const isWarning = remaining > 0 && remaining <= 300; // last 5 minutes
  const isDanger = remaining > 0 && remaining <= 60; // last minute
  const isFinished = remaining === 0 && totalSeconds > 0;

  const toggle = useCallback(() => {
    if (remaining === 0) {
      // Reset
      setRemaining(totalSeconds);
      setRunning(false);
    } else {
      setRunning((r) => !r);
    }
  }, [remaining, totalSeconds]);

  const reset = useCallback(() => {
    setRunning(false);
    setRemaining(totalSeconds);
  }, [totalSeconds]);

  const applyEdit = () => {
    const mins = Math.max(1, Math.min(999, editMin));
    const newTotal = mins * 60;
    setTotalSeconds(newTotal);
    setRemaining(newTotal);
    setRunning(false);
    setEditing(false);
  };

  const colorClass = isFinished
    ? 'text-red-600'
    : isDanger
      ? 'text-red-500 animate-pulse'
      : isWarning
        ? 'text-amber-500'
        : 'text-gray-800';

  const barColor = isFinished
    ? 'bg-red-500'
    : isDanger
      ? 'bg-red-400'
      : isWarning
        ? 'bg-amber-400'
        : percentage > 50
          ? 'bg-emerald-500'
          : 'bg-emerald-400';

  return (
    <div className={`bg-white rounded-2xl shadow-md border p-4 transition-all ${
      isFinished ? 'border-red-300 bg-red-50 ring-2 ring-red-200' : isDanger ? 'border-amber-300' : 'border-gray-100'
    }`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{isFinished ? '🔔' : running ? '⏱️' : '⏸️'}</span>
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Serien-Timer
            </div>
            {editing ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={editMin}
                  onChange={(e) => setEditMin(parseInt(e.target.value) || 1)}
                  onKeyDown={(e) => e.key === 'Enter' && applyEdit()}
                  className="w-20 px-2 py-1 border rounded text-sm text-center"
                  autoFocus
                />
                <span className="text-xs text-gray-500">Min</span>
                <button onClick={applyEdit} className="px-2 py-1 bg-emerald-600 text-white rounded text-xs">✓</button>
                <button onClick={() => setEditing(false)} className="px-2 py-1 bg-gray-200 rounded text-xs">✕</button>
              </div>
            ) : (
              <div className={`text-3xl font-mono font-extrabold tabular-nums tracking-tight ${colorClass}`}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                {isFinished && <span className="text-base ml-2 font-sans">Zeit abgelaufen!</span>}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editing && (
            <>
              <button
                onClick={toggle}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  isFinished
                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                    : running
                      ? 'bg-amber-500 text-white hover:bg-amber-600'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {isFinished ? '↻ Neu' : running ? '⏸ Pause' : '▶ Start'}
              </button>
              {!running && remaining !== totalSeconds && !isFinished && (
                <button
                  onClick={reset}
                  className="px-3 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  ↻
                </button>
              )}
              {!running && (
                <button
                  onClick={() => { setEditMin(Math.round(totalSeconds / 60)); setEditing(true); }}
                  className="px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  title="Zeit einstellen"
                >
                  ⚙️
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {/* Progress bar */}
      {!editing && (
        <div className="mt-3 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${barColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
