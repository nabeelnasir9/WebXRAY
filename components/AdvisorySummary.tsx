'use client';

import { useMemo, useState } from 'react';
import type { AdvisoryLevel, CheckResult } from '@/lib/types';
import { checkTitle } from '@/lib/manifest';
import { CopyButton } from './CopyButton';

interface Props {
  results: Record<string, CheckResult>;
}

interface Row {
  level: AdvisoryLevel;
  title: string;
  detail?: string;
  remediation?: string;
  source: string; // check title it came from
}

const ORDER: AdvisoryLevel[] = ['issue', 'warning', 'info', 'pass'];
const LABEL: Record<AdvisoryLevel, string> = {
  issue: 'Issues',
  warning: 'Warnings',
  info: 'Info',
  pass: 'Passes',
};

export function AdvisorySummary({ results }: Props) {
  const [issuesOnly, setIssuesOnly] = useState(false);

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    for (const res of Object.values(results)) {
      if (res.status !== 'ok' || !res.advisories) continue;
      const source = checkTitle(res.id);
      for (const a of res.advisories) out.push({ ...a, source });
    }
    return out.sort((a, b) => ORDER.indexOf(a.level) - ORDER.indexOf(b.level));
  }, [results]);

  const counts = useMemo(() => {
    const c: Record<AdvisoryLevel, number> = { issue: 0, warning: 0, info: 0, pass: 0 };
    for (const r of rows) c[r.level]++;
    return c;
  }, [rows]);

  const visible = issuesOnly ? rows.filter((r) => r.level === 'issue' || r.level === 'warning') : rows;
  const visibleLevels = issuesOnly ? ORDER.filter((level) => level === 'issue' || level === 'warning') : ORDER;

  return (
    <section className="summary" aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="sr-only">
        Advisory summary
      </h2>
      {/* Discreet polite status so screen readers hear the running tally
          without re-reading the whole panel on every card that resolves. */}
      <p className="sr-only" aria-live="polite" role="status">
        {counts.issue} issues, {counts.warning} warnings, {counts.info} info, {counts.pass} passes.
      </p>
      <div className="summary__top">
        <div className="pills">
          {ORDER.map((level) => (
            <span key={level} className={`pill pill--${level}`}>
              {LABEL[level]} <span className="pill__count">{counts[level]}</span>
            </span>
          ))}
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={issuesOnly}
            onChange={(e) => setIssuesOnly(e.target.checked)}
          />
          Show issues only
        </label>
      </div>

      {visible.length === 0 ? (
        <p className="empty-note">
          {rows.length === 0
            ? 'No advisories yet — results are still coming in.'
            : 'No issues or warnings. Everything checked out.'}
        </p>
      ) : (
        <div className="advisory-accordions">
          {visibleLevels.map((level) => {
            const group = visible.filter((r) => r.level === level);
            return (
              <details
                key={level}
                className={`advisory-group advisory-group--${level}`}
              >
                <summary className="advisory-group__summary">
                  <span>{LABEL[level]}</span>
                  <span className="advisory-group__count">{group.length}</span>
                </summary>
                {group.length === 0 ? (
                  <p className="advisory-group__empty">No {LABEL[level].toLowerCase()}.</p>
                ) : (
                  <ul className="advisory-list">
                    {group.map((r, i) => (
                      <li key={`${r.source}-${r.title}-${i}`} className={`advisory advisory--${r.level}`}>
                        <div className="advisory__title">
                          <span>{r.title}</span>
                          <span className="advisory__source">· {r.source}</span>
                        </div>
                        {r.detail && <p className="advisory__detail">{r.detail}</p>}
                        {r.remediation && (
                          <div className="remediation">
                            <CopyButton text={r.remediation} label="Copy fix" />
                            <pre>{r.remediation}</pre>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
}
