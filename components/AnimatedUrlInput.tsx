'use client';

import { useEffect, useState, type ChangeEvent } from 'react';

const EXAMPLES = ['duck.com', 'bbc.co.uk', 'github.com', 'stripe.com', 'bemsolutions.io'];

interface Props {
  id: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function AnimatedUrlInput({ id, value, onChange }: Props) {
  const [index, setIndex] = useState(0);
  const [slide, setSlide] = useState(false);
  const [noTransition, setNoTransition] = useState(false);

  useEffect(() => {
    if (value.trim()) return;

    const timer = window.setInterval(() => setSlide(true), 2600);
    return () => window.clearInterval(timer);
  }, [value]);

  function handleTransitionEnd() {
    if (!slide) return;

    setNoTransition(true);
    setSlide(false);
    setIndex((i) => (i + 1) % EXAMPLES.length);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => setNoTransition(false));
    });
  }

  const next = EXAMPLES[(index + 1) % EXAMPLES.length];

  return (
    <div className="home__input-shell">
      {!value.trim() && (
        <div className="home__input-ghost" aria-hidden="true">
          <div
            className={`home__input-ghost-track${slide ? ' is-sliding' : ''}${noTransition ? ' no-transition' : ''}`}
            onTransitionEnd={handleTransitionEnd}
          >
            <span className="home__input-ghost-item">{EXAMPLES[index]}</span>
            <span className="home__input-ghost-item">{next}</span>
          </div>
        </div>
      )}
      <input
        id={id}
        className="home__input"
        type="text"
        inputMode="url"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder=""
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
