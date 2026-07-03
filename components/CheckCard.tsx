'use client';

import { Fragment, useState, type ReactNode } from 'react';
import type { CheckResult } from '@/lib/types';

export type CardState = 'idle' | 'loading' | CheckResult['status'];

interface Props {
  checkId: string;
  title: string;
  about: string;
  state: CardState;
  result?: CheckResult;
  canRefresh?: boolean;
  onRefresh?: (checkId: string) => void;
}

const DOT_LABEL: Record<CardState, string> = {
  idle: 'Idle',
  loading: 'Running',
  ok: 'OK',
  error: 'Error',
  skipped: 'Skipped',
};

export function CheckCard({
  checkId,
  title,
  about,
  state,
  result,
  canRefresh = false,
  onRefresh,
}: Props) {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <article className={`card card--${state}`}>
      <div className="card__head">
        <h3 className="card__title">{title}</h3>
        <div className="card__actions">
          <button
            type="button"
            className={`card__icon-btn${infoOpen ? ' card__icon-btn--active' : ''}`}
            aria-label={`About ${title}`}
            aria-expanded={infoOpen}
            onClick={() => setInfoOpen((open) => !open)}
          >
            ⓘ
          </button>
          <button
            type="button"
            className="card__icon-btn"
            aria-label={`Re-run ${title}`}
            disabled={!canRefresh || !onRefresh}
            onClick={() => onRefresh?.(checkId)}
          >
            ↻
          </button>
        </div>
      </div>

      {infoOpen && (
        <div className="card__info">
          <p>{about}</p>
          {result && (
            <pre className="card__info-raw">{JSON.stringify(redactResult(result), null, 2)}</pre>
          )}
        </div>
      )}

      <div className="card__body">{renderBody(state, result)}</div>

      {result && state !== 'idle' && (
        <div className="card__foot">
          <span>{DOT_LABEL[state]}</span>
          {result.tookMs > 0 && <span>{result.tookMs} ms</span>}
        </div>
      )}
    </article>
  );
}

function renderBody(state: CardState, result?: CheckResult) {
  if (state === 'idle') return <p className="card__muted">Waiting…</p>;
  if (state === 'loading') return <p className="card__muted">Running…</p>;
  if (state === 'error') return <p className="card__error">{result?.error ?? 'Check failed'}</p>;
  if (state === 'skipped')
    return <p className="card__skipped">{result?.error ?? 'Skipped (no key configured)'}</p>;

  // ok
  const data = result?.data ?? {};
  const shot = data.imageUrl as string | undefined;
  const og = data.ogImage as string | undefined;
  const imageSrc = shot ?? og;
  const imageAlt = shot ? 'Rendered page screenshot' : 'Open Graph preview image';
  const hasKv = Object.keys(sanitize(data)).length > 0;

  return (
    <>
      {imageSrc && <CardImage src={imageSrc} alt={imageAlt} />}
      {hasKv ? <KeyValueData data={data} /> : imageSrc ? null : <p className="card__muted">No data returned</p>}
    </>
  );
}

function KeyValueData({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(sanitize(data));
  if (entries.length === 0) return <p className="card__muted">No data returned</p>;

  return (
    <dl className="kv">
      {entries.map(([key, value]) => (
        <Fragment key={key}>{renderEntry(key, value)}</Fragment>
      ))}
    </dl>
  );
}

function renderEntry(key: string, value: unknown): ReactNode {
  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    return (
      <div className="kv__section">
        <dt className="kv__section-title">{label(key)}</dt>
        <dd>
          <dl className="kv kv--nested">
            {entries.map(([childKey, childValue]) => (
              <Fragment key={childKey}>{renderEntry(childKey, childValue)}</Fragment>
            ))}
          </dl>
        </dd>
      </div>
    );
  }

  if (Array.isArray(value)) {
    return (
      <div className="kv__row">
        <dt>{label(key)}</dt>
        <dd>{renderArray(value)}</dd>
      </div>
    );
  }

  return (
    <div className="kv__row">
      <dt>{label(key)}</dt>
      <dd>{renderScalar(value, key)}</dd>
    </div>
  );
}

function renderArray(value: unknown[]) {
  if (value.length === 0) return <span className="value value--muted">None</span>;
  if (value.every((v) => !isPlainObject(v) && !Array.isArray(v))) {
    return (
      <ul className="value-list">
        {value.slice(0, 12).map((item, index) => (
          <li key={index}>{renderScalar(item, '')}</li>
        ))}
        {value.length > 12 && <li className="value value--muted">+{value.length - 12} more</li>}
      </ul>
    );
  }

  return (
    <ul className="value-list value-list--objects">
      {value.slice(0, 6).map((item, index) => (
        <li key={index}>{isPlainObject(item) ? compactObject(item) : renderScalar(item, '')}</li>
      ))}
      {value.length > 6 && <li className="value value--muted">+{value.length - 6} more</li>}
    </ul>
  );
}

function renderScalar(value: unknown, key: string) {
  if (typeof value === 'boolean') {
    const status = booleanStatus(key, value);
    return (
      <span className={`status status--${status.tone}`}>
        <span aria-hidden="true">{status.icon}</span> {status.label}
      </span>
    );
  }
  if (value == null || value === '') return <span className="value value--muted">Not present</span>;
  if (typeof value === 'number') return <span>{Number.isFinite(value) ? value.toLocaleString() : value}</span>;
  return <span>{String(value)}</span>;
}

function booleanStatus(key: string, value: boolean) {
  const normalized = key.toLowerCase();
  if (normalized.includes('pending')) {
    return value
      ? { tone: 'warn', icon: '△', label: 'Pending' }
      : { tone: 'yes', icon: '✓', label: 'Ready' };
  }
  if (
    normalized.includes('safe') ||
    normalized.includes('trusted') ||
    normalized.includes('authorized') ||
    normalized.includes('ok') ||
    normalized.includes('valid')
  ) {
    return value
      ? { tone: 'yes', icon: '✓', label: normalized.includes('safe') ? 'Safe' : 'Pass' }
      : { tone: 'no', icon: '×', label: 'Fail' };
  }
  return value
    ? { tone: 'yes', icon: '✓', label: 'Yes' }
    : { tone: 'no', icon: '×', label: 'No' };
}

function compactObject(value: Record<string, unknown>) {
  return Object.entries(value)
    .map(([key, child]) => `${label(key)}: ${formatInline(child)}`)
    .join(' · ');
}

function formatInline(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value == null || value === '') return 'Not present';
  if (Array.isArray(value)) return value.map(formatInline).join(', ');
  if (isPlainObject(value)) return compactObject(value);
  return String(value);
}

function label(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

// Small image renderer that hides itself if the URL 404s / blocks hotlinking,
// so a broken OG image never leaves a torn-icon in the card.
function CardImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="card__shot"
      src={src}
      alt={alt}
      width={1280}
      height={720}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function sanitize(data: Record<string, unknown>): Record<string, unknown> {
  const clone: Record<string, unknown> = { ...data };
  delete clone.results;
  delete clone.imageUrl;
  delete clone.captureLink;
  if (clone.pending === false) delete clone.pending;
  if (clone.lookupPending === false) delete clone.lookupPending;
  if (clone.unavailable === false) delete clone.unavailable;
  return clone;
}

function redactResult(result: CheckResult): CheckResult {
  return {
    ...result,
    data: result.data ? (redactValue(result.data) as Record<string, unknown>) : undefined,
  };
}

function redactValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value
      .replace(/access_key=[^&\s"]+/gi, 'access_key=[redacted]')
      .replace(/([?&]key=)[^&\s"]+/gi, '$1[redacted]');
  }
  if (Array.isArray(value)) return value.map(redactValue);
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      if (key === 'imageUrl' || key === 'captureLink') continue;
      out[key] = redactValue(child);
    }
    return out;
  }
  return value;
}
