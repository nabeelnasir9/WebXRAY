import { NextRequest, NextResponse } from 'next/server';
import { registry } from '@/lib/registry';
import type { CheckResult } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 10; // Vercel Hobby hard cap
const CHECK_TIMEOUT_MS = 9_000; // backstop under the ceiling

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const target = req.nextUrl.searchParams.get('url');
  const check = registry[id];

  if (!check) return NextResponse.json({ error: 'unknown check' }, { status: 404 });
  if (!target) return NextResponse.json({ error: 'missing ?url' }, { status: 400 });

  if (check.needsKey && !process.env[check.needsKey]) {
    return NextResponse.json({
      id,
      status: 'skipped',
      tookMs: 0,
      error: `${check.needsKey} not set`,
    } satisfies CheckResult);
  }

  const started = Date.now();
  try {
    const url = new URL(target.startsWith('http') ? target : `https://${target}`);
    const data = await withTimeout(check.run(url), CHECK_TIMEOUT_MS);
    const advisories = check.advise?.(data) ?? [];
    return NextResponse.json({
      id,
      status: 'ok',
      tookMs: Date.now() - started,
      data,
      advisories,
    } satisfies CheckResult);
  } catch (err) {
    return NextResponse.json({
      id,
      status: 'error',
      tookMs: Date.now() - started,
      error: err instanceof Error ? err.message : 'check failed',
    } satisfies CheckResult);
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, r) =>
      setTimeout(() => r(new Error(`timeout after ${ms}ms`)), ms),
    ),
  ]);
}
