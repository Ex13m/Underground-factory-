import { useEffect, useRef } from 'react';

/**
 * Scroll-reveal: наблюдает за всеми `.reveal` внутри контейнера (или за самим
 * контейнером, если он сам `.reveal`) и добавляет класс `in` при появлении
 * во вьюпорте. Calm-режим гасится на уровне CSS (body.calm .reveal { ... }).
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(deps: unknown[] = []) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const targets = root.classList.contains('reveal')
      ? [root as HTMLElement]
      : Array.from(root.querySelectorAll<HTMLElement>('.reveal'));
    if (targets.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -5% 0px' },
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
