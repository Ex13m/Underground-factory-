/** Мелкие утилиты админки. */

/** slug из произвольной строки: 'GT Wing "TABLETOP"' -> 'gt-wing-tabletop' */
export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'item'
  );
}

/** уникальный id: слаг + время в base36 */
export function makeId(base: string): string {
  return `${slugify(base)}-${Date.now().toString(36)}`;
}

/** парс положительного числа из строки инпута; NaN если мусор */
export function posNum(raw: string): number {
  const n = Number(raw.replace(',', '.').trim());
  return Number.isFinite(n) && n > 0 ? n : NaN;
}
