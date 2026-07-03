'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkList } from '@/lib/manifest';
import type { CheckResult } from '@/lib/types';
import { checkReportPath, normalizeDomain, scanTargetUrl } from '@/lib/url';
import { ScanBar } from '@/components/ScanBar';
import { ScanProgress } from '@/components/ScanProgress';
import { AdvisorySummary } from '@/components/AdvisorySummary';
import { CheckGrid } from '@/components/CheckGrid';

interface Props {
  domain: string;
}

export function ScanReport({ domain }: Props) {
  const router = useRouter();
  const slug = normalizeDomain(domain);
  const target = scanTargetUrl(slug);

  const [results, setResults] = useState<Record<string, CheckResult>>({});
  const [scanning, setScanning] = useState(false);
  const [refreshing, setRefreshing] = useState<Set<string>>(() => new Set());
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  const runScan = useCallback(async (scanUrl: string) => {
    setScanning(true);
    setResults({});
    setRefreshing(new Set());
    setElapsedMs(null);
    const started = Date.now();

    await Promise.allSettled(
      checkList.map((c) =>
        fetch(`/api/check/${c.id}?url=${encodeURIComponent(scanUrl)}`)
          .then((r) => r.json() as Promise<CheckResult>)
          .then((res) => {
            if (res.status === 'error') {
              console.error(`[webxray] ${c.id} failed:`, res.error);
            } else if (res.status === 'skipped') {
              console.info(`[webxray] ${c.id} skipped:`, res.error);
            }
            setResults((prev) => ({ ...prev, [c.id]: res }));
          })
          .catch(() => {
            console.error(`[webxray] ${c.id} request failed`);
            setResults((prev) => ({
              ...prev,
              [c.id]: { id: c.id, status: 'error', tookMs: 0, error: 'request failed' },
            }));
          }),
      ),
    );

    setElapsedMs(Date.now() - started);
    setScanning(false);
  }, []);

  useEffect(() => {
    if (!slug) return;
    runScan(target);
  }, [slug, target, runScan]);

  async function refreshCheck(checkId: string) {
    if (!target) return;
    let blocked = false;
    setRefreshing((prev) => {
      if (prev.has(checkId)) {
        blocked = true;
        return prev;
      }
      return new Set(prev).add(checkId);
    });
    if (blocked) return;

    try {
      const r = await fetch(`/api/check/${checkId}?url=${encodeURIComponent(target)}`);
      const res = (await r.json()) as CheckResult;
      setResults((prev) => ({ ...prev, [checkId]: res }));
    } catch {
      setResults((prev) => ({
        ...prev,
        [checkId]: { id: checkId, status: 'error', tookMs: 0, error: 'request failed' },
      }));
    } finally {
      setRefreshing((prev) => {
        const next = new Set(prev);
        next.delete(checkId);
        return next;
      });
    }
  }

  function handleScan(input: string) {
    const next = normalizeDomain(input);
    if (!next) return;
    if (next === slug) {
      runScan(scanTargetUrl(next));
      return;
    }
    router.push(checkReportPath(next));
  }

  if (!slug) {
    return <p className="card__error">Invalid domain.</p>;
  }

  return (
    <>
      <p className="report-domain">
        Report for{' '}
        <a href={target} target="_blank" rel="noopener noreferrer">
          {slug}
        </a>
      </p>

      <ScanBar scanning={scanning} defaultValue={slug} onScan={handleScan} />

      <ScanProgress
        scanning={scanning}
        results={results}
        refreshing={refreshing}
        elapsedMs={elapsedMs}
        onRefresh={refreshCheck}
      />

      <div id="results">
        <AdvisorySummary results={results} />
        <CheckGrid
          scanning={scanning}
          results={results}
          refreshing={refreshing}
          canRefresh={!!target && !scanning}
          onRefresh={refreshCheck}
        />
      </div>
    </>
  );
}
