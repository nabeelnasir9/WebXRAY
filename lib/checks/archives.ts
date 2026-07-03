import type { Check } from '../types';
import { timedFetch } from '../net';

function formatTimestamp(t?: string) {
  return t ? `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}` : null;
}

// Wayback APIs are slow and flaky. Never fail the whole check on timeout — return
// partial data (or a pending flag) so one slow archive.org response can't error the card.
export const archivesCheck: Check = {
  id: 'archives',
  title: 'Archive history',
  async run(url) {
    const host = url.hostname;

    const [availSettled, cdxSettled] = await Promise.allSettled([
      timedFetch(
        `https://archive.org/wayback/available?url=${encodeURIComponent(host)}`,
        { headers: { accept: 'application/json' } },
        3200,
      ),
      timedFetch(
        `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(host)}&output=json&fl=timestamp&collapse=timestamp:6&limit=500`,
        { headers: { accept: 'application/json' } },
        3200,
      ),
    ]);

    let closest: { timestamp?: string; url?: string } | undefined;
    let availError: string | null = null;

    if (availSettled.status === 'fulfilled') {
      const avail = availSettled.value;
      if (avail.ok) {
        const aj = (await avail.json()) as {
          archived_snapshots?: { closest?: { timestamp?: string; url?: string } };
        };
        closest = aj.archived_snapshots?.closest;
      } else {
        availError = `Wayback available API returned ${avail.status}`;
      }
    } else {
      availError =
        availSettled.reason instanceof Error
          ? availSettled.reason.message
          : 'Wayback available API unavailable';
    }

    let snapshots: number | null = null;
    if (cdxSettled.status === 'fulfilled' && cdxSettled.value.ok) {
      try {
        const rows = (await cdxSettled.value.json()) as string[][];
        snapshots = Math.max(0, rows.length - 1);
      } catch {
        /* malformed CDX payload — ignore */
      }
    }

    const result: Record<string, unknown> = {
      archived: closest ? true : availError ? null : false,
      closestSnapshot: formatTimestamp(closest?.timestamp),
      closestUrl: closest?.url ?? null,
      ...(availError && !closest ? { lookupPending: true, note: availError } : {}),
    };
    if (closest) {
      if (snapshots != null) result.snapshots = snapshots;
      else result.snapshotsNote = 'Count unavailable (CDX timed out)';
    } else {
      result.snapshots = 0;
    }
    return result;
  },
  advise(data) {
    if (data.lookupPending) {
      return [
        {
          level: 'info',
          title: 'Archive lookup still pending',
          detail:
            (data.note as string) ??
            'Wayback Machine did not respond in time — refresh this check to retry.',
        },
      ];
    }
    if (!data.archived) {
      return [
        {
          level: 'info',
          title: 'No Wayback Machine snapshots',
          detail: 'The site has never been archived.',
          remediation: 'Submit the URL to web.archive.org to preserve a public record.',
        },
      ];
    }
    return [];
  },
};
