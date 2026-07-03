'use client';

import { useMemo, useState } from 'react';
import { checkList } from '@/lib/manifest';
import type { CheckResult, CheckStatus } from '@/lib/types';

interface Props {
  scanning: boolean;
  results: Record<string, CheckResult>;
  refreshing: Set<string>;
  elapsedMs: number | null;
  onRefresh: (checkId: string) => void;
}

type RowState = CheckStatus | 'loading' | 'idle';

const ICON: Record<RowState, string> = {
  ok: '✅',
  skipped: '⏭️',
  error: '❌',
  loading: '⏳',
  idle: '○',
};

const LABEL: Record<CheckStatus, string> = {
  ok: 'success',
  skipped: 'skipped',
  error: 'error',
};

export function ScanProgress({ scanning, results, refreshing, elapsedMs, onRefresh }: Props) {
  const [expandedReason, setExpandedReason] = useState<string | null>(null);

  const stats = useMemo(() => {
    let ok = 0;
    let skipped = 0;
    let error = 0;
    let pending = 0;
    for (const c of checkList) {
      if (refreshing.has(c.id)) {
        pending++;
        continue;
      }
      const r = results[c.id];
      if (!r) {
        if (scanning) pending++;
        continue;
      }
      if (r.status === 'ok') ok++;
      else if (r.status === 'skipped') skipped++;
      else error++;
    }
    return { ok, skipped, error, pending, total: checkList.length };
  }, [results, scanning, refreshing]);

  const barTotal = Math.max(stats.ok + stats.skipped + stats.error + stats.pending, 1);

  function rowState(id: string): RowState {
    if (refreshing.has(id)) return 'loading';
    const r = results[id];
    if (!r) return scanning ? 'loading' : 'idle';
    return r.status;
  }

  function toggleReason(id: string) {
    setExpandedReason((prev) => (prev === id ? null : id));
  }

  return (
    <section className="scan-progress" aria-live="polite">
      <div className="scan-progress__summary">
        <div className="scan-progress__counts">
          <span className="scan-progress__ok">
            {stats.ok} job{stats.ok === 1 ? '' : 's'} successful
          </span>
          {stats.skipped > 0 && (
            <span className="scan-progress__skip">
              {stats.skipped} job{stats.skipped === 1 ? '' : 's'} skipped
            </span>
          )}
          {stats.error > 0 && (
            <span className="scan-progress__fail">
              {stats.error} job{stats.error === 1 ? '' : 's'} failed
            </span>
          )}
          {scanning && stats.pending > 0 && (
            <span className="scan-progress__pending">{stats.pending} running…</span>
          )}
        </div>
        <span className="scan-progress__time">
          {scanning ? 'Scanning…' : elapsedMs != null ? `Done in ${(elapsedMs / 1000).toFixed(1)} s` : ''}
        </span>
      </div>

      <div
        className="scan-progress__bar"
        role="progressbar"
        aria-valuenow={stats.ok + stats.skipped + stats.error}
        aria-valuemin={0}
        aria-valuemax={stats.total}
      >
        <span
          className="scan-progress__bar-seg scan-progress__bar-seg--ok"
          style={{ width: `${(stats.ok / barTotal) * 100}%` }}
        />
        <span
          className="scan-progress__bar-seg scan-progress__bar-seg--skip"
          style={{ width: `${(stats.skipped / barTotal) * 100}%` }}
        />
        <span
          className="scan-progress__bar-seg scan-progress__bar-seg--fail"
          style={{ width: `${(stats.error / barTotal) * 100}%` }}
        />
        {scanning && (
          <span
            className="scan-progress__bar-seg scan-progress__bar-seg--pending"
            style={{ width: `${(stats.pending / barTotal) * 100}%` }}
          />
        )}
      </div>

      <details className="scan-progress__details">
        <summary className="scan-progress__toggle">Show Details</summary>
        <ul className="scan-progress__list">
          {checkList.map((c) => {
            const state = rowState(c.id);
            const result = results[c.id];
            const isTerminal = state === 'ok' || state === 'skipped' || state === 'error';
            const statusLabel =
              state === 'loading' ? 'running' : state === 'idle' ? 'waiting' : LABEL[state];

            return (
              <li key={c.id} className={`scan-progress__row scan-progress__row--${state}`}>
                <div className="scan-progress__row-main">
                  <span className="scan-progress__icon" aria-hidden="true">
                    {ICON[state]}
                  </span>
                  <span className="scan-progress__id">{c.id}</span>
                  <span className={`scan-progress__status scan-progress__status--${state}`}>
                    ({statusLabel})
                  </span>
                  {result && result.tookMs > 0 && (
                    <span className="scan-progress__took">Took {result.tookMs} ms</span>
                  )}
                  {(state === 'error' || state === 'skipped') && (
                    <span className="scan-progress__row-actions">
                      <button
                        type="button"
                        className="scan-progress__mini-btn"
                        onClick={() => onRefresh(c.id)}
                        disabled={scanning || refreshing.has(c.id)}
                      >
                        ↻ Retry
                      </button>
                      <button
                        type="button"
                        className="scan-progress__mini-btn"
                        onClick={() => toggleReason(c.id)}
                      >
                        ■ {state === 'error' ? 'Show Error' : 'Show Skip Reason'}
                      </button>
                    </span>
                  )}
                </div>
                {expandedReason === c.id && isTerminal && result?.error && (
                  <pre className="scan-progress__reason">{result.error}</pre>
                )}
              </li>
            );
          })}
        </ul>
        <p className="scan-progress__foot scan-progress__foot--warn">
          Check the browser console for logs and more info
        </p>
        <p className="scan-progress__foot">
          It&apos;s normal for some jobs to fail, either because the host doesn&apos;t return the
          required info, or restrictions in the lambda function, or hitting an API limit.
        </p>
      </details>
    </section>
  );
}
