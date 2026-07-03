'use client';

import { useEffect, useState } from 'react';

interface Props {
  scanning: boolean;
  onScan: (target: string) => void;
  defaultValue?: string;
}

export function ScanBar({ scanning, onScan, defaultValue = '' }: Props) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (defaultValue) setValue(defaultValue);
  }, [defaultValue]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed && !scanning) onScan(trimmed);
  }

  return (
    <form className="scanbar" onSubmit={submit}>
      <label htmlFor="scan-url" className="sr-only">
        Website URL to scan
      </label>
      <input
        id="scan-url"
        name="url"
        className="scanbar__input"
        type="text"
        inputMode="url"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="example.com"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Website URL to scan"
      />
      <button className="scanbar__btn" type="submit" disabled={scanning || !value.trim()}>
        {scanning && <span className="spinner" aria-hidden="true" />}
        {scanning ? 'Scanning…' : 'Analyze'}
      </button>
    </form>
  );
}
