import type { Check } from '../types';
import { timedFetch } from '../net';

// A full CVE sweep (POODLE/ROBOT/DROWN/Heartbleed) takes 30s+, which cannot run
// inline under the 10s cap. We hit the SSL Labs API in "return cached, don't
// start new" mode: if Labs already has a recent result we surface the grade
// instantly; otherwise we kick off an async assessment and report it as pending
// so the user can re-run once it finishes. No single request runs long.
export const tlsAuditCheck: Check = {
  id: 'tls-audit',
  title: 'TLS security audit',
  async run(url) {
    const host = url.hostname;
    const api = new URL('https://api.ssllabs.com/api/v3/analyze');
    api.searchParams.set('host', host);
    api.searchParams.set('fromCache', 'on');
    api.searchParams.set('maxAge', '24'); // hours
    api.searchParams.set('all', 'done');

    const r = await timedFetch(api.href, { headers: { accept: 'application/json' } }, 8000);
    if (!r.ok) throw new Error(`SSL Labs API failed (${r.status})`);
    const j = (await r.json()) as {
      status?: string;
      endpoints?: { grade?: string; ipAddress?: string; statusMessage?: string }[];
    };

    const grades = (j.endpoints ?? [])
      .map((e) => ({ ip: e.ipAddress, grade: e.grade }))
      .filter((g): g is { ip: string | undefined; grade: string } => !!g.grade);

    // READY *and* we actually have graded endpoints → real result.
    if (j.status === 'READY' && grades.length > 0) {
      return { status: 'READY', grades };
    }
    if (j.status === 'READY') {
      return {
        status: 'No grade returned',
        endpoints: (j.endpoints ?? []).map((e) => ({
          ip: e.ipAddress,
          status: e.statusMessage ?? 'Unexpected failure',
        })),
        note: 'SSL Labs finished the assessment but did not return a grade for this endpoint.',
      };
    }
    return {
      lookupPending: true,
      status: j.status ?? 'IN_PROGRESS',
      note: 'SSL Labs is still assessing this host. Re-run this check in ~1–2 minutes for the full grade.',
    };
  },
  advise(data) {
    if (data.lookupPending) return [{ level: 'info', title: 'Full TLS audit still running — re-run shortly' }];
    if (data.status === 'No grade returned')
      return [
        {
          level: 'info',
          title: 'SSL Labs grade unavailable',
          detail: data.note as string,
        },
      ];
    const grades = (data.grades as { grade: string }[]) ?? [];
    const weak = grades.filter((g) => /^[CDEFT]/.test(g.grade));
    if (weak.length)
      return [
        {
          level: 'warning',
          title: `Low SSL Labs grade: ${weak.map((g) => g.grade).join(', ')}`,
          detail: 'One or more endpoints scored below B.',
          remediation: 'Review the full SSL Labs report (ssllabs.com/ssltest) and apply its protocol/cipher recommendations.',
        },
      ];
    if (grades.length)
      return [{ level: 'pass', title: `SSL Labs grade: ${grades.map((g) => g.grade).join(', ')}` }];
    return [];
  },
};
