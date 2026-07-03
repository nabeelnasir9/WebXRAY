'use client';

import { useState } from 'react';

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  return (
    <button
      type="button"
      className={`copy-btn${done ? ' copy-btn--done' : ''}`}
      onClick={copy}
      aria-live="polite"
      aria-label={done ? 'Copied to clipboard' : `${label} to clipboard`}
    >
      {done ? 'Copied' : label}
    </button>
  );
}
