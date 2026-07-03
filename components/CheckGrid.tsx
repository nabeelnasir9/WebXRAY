'use client';

import type { CheckResult } from '@/lib/types';
import { checkList } from '@/lib/manifest';
import { CheckCard, type CardState } from './CheckCard';

interface Props {
  scanning: boolean;
  results: Record<string, CheckResult>;
  refreshing: Set<string>;
  canRefresh: boolean;
  onRefresh: (checkId: string) => void;
}

export function CheckGrid({ scanning, results, refreshing, canRefresh, onRefresh }: Props) {
  return (
    <section className="grid" aria-label="Check results">
      {checkList.map((c) => {
        const result = results[c.id];
        const isRefreshing = refreshing.has(c.id);
        const state: CardState = isRefreshing
          ? 'loading'
          : result
            ? result.status
            : scanning
              ? 'loading'
              : 'idle';
        return (
          <CheckCard
            key={c.id}
            checkId={c.id}
            title={c.title}
            about={c.about}
            state={state}
            result={result}
            canRefresh={canRefresh && !isRefreshing}
            onRefresh={onRefresh}
          />
        );
      })}
    </section>
  );
}
