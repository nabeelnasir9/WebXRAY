'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const STEPS = [
  'Validating URL',
  'Resolving domain',
  'Mapping DNS & TLS',
  'Queuing security checks',
  'Launching X-Ray scan',
];

const STEP_MS = 520;

interface Props {
  open: boolean;
  domain: string;
  onDone: () => void;
}

export function ScanLaunchModal({ open, domain, onDone }: Props) {
  const [mounted, setMounted] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setActiveStep(0);
      return;
    }

    const timers: number[] = [];

    for (let i = 1; i <= STEPS.length; i += 1) {
      timers.push(window.setTimeout(() => setActiveStep(i), i * STEP_MS));
    }

    timers.push(window.setTimeout(onDone, STEPS.length * STEP_MS + 380));

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [open, onDone]);

  if (!open || !mounted) return null;

  const progress = Math.round((activeStep / STEPS.length) * 100);

  return createPortal(
    <div
      className="scan-launch"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scan-launch-title"
      aria-busy={activeStep < STEPS.length}
    >
      <div className="scan-launch__backdrop" aria-hidden="true" />
      <div className="scan-launch__panel">
        <p className="scan-launch__eyebrow">WebXRAY</p>
        <h2 id="scan-launch-title" className="scan-launch__title">
          Preparing your scan
        </h2>
        <p className="scan-launch__domain">{domain}</p>

        <div className="scan-launch__bar" aria-hidden="true">
          <span className="scan-launch__bar-fill" style={{ width: `${progress}%` }} />
        </div>

        <ol className="scan-launch__steps">
          {STEPS.map((label, i) => {
            const done = i < activeStep;
            const active = i === activeStep && activeStep < STEPS.length;
            const status = done ? 'done' : active ? 'active' : 'pending';

            return (
              <li key={label} className={`scan-launch__step scan-launch__step--${status}`}>
                <span className="scan-launch__step-icon" aria-hidden="true">
                  {done ? '✓' : active ? '' : '○'}
                </span>
                <span>{label}</span>
                {active && <span className="scan-launch__spinner" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
      </div>
    </div>,
    document.body,
  );
}
