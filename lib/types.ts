export type CheckStatus = 'ok' | 'error' | 'skipped';
export type AdvisoryLevel = 'issue' | 'warning' | 'info' | 'pass';

export interface Advisory {
  level: AdvisoryLevel;
  title: string; // "No DMARC record found"
  detail?: string; // current state / what's wrong
  remediation?: string; // the exact copy-paste fix (required for issue/warning)
}

export interface CheckResult {
  id: string;
  status: CheckStatus;
  tookMs: number;
  data?: Record<string, unknown>;
  error?: string;
  advisories?: Advisory[];
}

export interface Check {
  id: string;
  title: string;
  needsKey?: string; // env var; unset -> 'skipped'
  run: (url: URL) => Promise<Record<string, unknown>>; // resolve data OR throw
  advise?: (data: Record<string, unknown>) => Advisory[]; // derive advisories
}
