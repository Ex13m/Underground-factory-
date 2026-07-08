/**
 * Анонс обновлений: после выхода новой версии сайта строки «что поменялось»
 * пролетают через экран справа налево — быстро выезжают, ~5 секунд медленно
 * плывут по центру (слегка приближаясь и растворяясь) с фирменным глитчем,
 * затем быстро уезжают. Показывается один раз на версию (localStorage),
 * клик — пропустить. В calm-режиме не показывается.
 */

import { useEffect, useState } from 'react';
import { useI18n } from '../lib/i18n';
import { useUI } from '../store/ui';
import { UPDATE_NOTES } from '../data/updates';
import '../styles/updates.css';

const SEEN_LS = 'uf:seen-version';

export function UpdatesTicker() {
  const { lt } = useI18n();
  const calm = useUI((s) => s.calm);
  const [idx, setIdx] = useState(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (calm) return;
    if (!UPDATE_NOTES.length) return;
    if (localStorage.getItem(SEEN_LS) === __APP_VERSION__) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // не перебиваем интро: анонс стартует с небольшой задержкой
    const t = setTimeout(() => setActive(true), 6500);
    return () => clearTimeout(t);
  }, [calm]);

  const finish = () => {
    localStorage.setItem(SEEN_LS, __APP_VERSION__);
    setActive(false);
  };

  const next = () => {
    if (idx + 1 >= UPDATE_NOTES.length) finish();
    else setIdx(idx + 1);
  };

  if (!active) return null;
  const note = UPDATE_NOTES[idx];

  return (
    <div className="updates" onClick={finish} title="Клик — пропустить">
      <div key={idx} className="updates-line stencil" onAnimationEnd={next}>
        <span className="glitch auto" data-text={lt(note)}>{lt(note)}</span>
      </div>
    </div>
  );
}
