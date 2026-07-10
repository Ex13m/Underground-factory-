/**
 * Улучшатель кастомных промптов — иконка ✨ рядом с ЛЮБЫМ полем промпта.
 * Отдаёт сырой текст серверному агенту (/api/generate, enhance):
 * замысел пользователя — закон, агент только обогащает (композиция, свет,
 * материалы, среда). mode 'image' — фото-промпт по-английски;
 * mode 'scenario' — сценарий рилса на языке пользователя.
 * Результат кладётся обратно в поле — можно править дальше.
 */

import { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { readGenKeys } from '../lib/imagegen';

export function PromptBoost({
  value,
  onChange,
  car,
  style,
  mode = 'image',
}: {
  value: string;
  onChange: (next: string) => void;
  /** имя тачки — агент вплетёт точный кузов */
  car?: string;
  /** добавить лёгкую палитру сайта */
  style?: boolean;
  mode?: 'image' | 'scenario';
}) {
  const { t } = useI18n();
  const [state, setState] = useState<'idle' | 'busy' | 'err'>('idle');

  const boost = async () => {
    if (!value.trim() || state === 'busy') return;
    setState('busy');
    try {
      const rKey = readGenKeys().replicate?.trim();
      const r = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(rKey ? { 'x-replicate-key': rKey } : {}),
        },
        body: JSON.stringify({ enhance: { prompt: value, car, style, mode } }),
      });
      const d = await r.json().catch(() => ({} as { prompt?: string }));
      if (r.ok && d?.prompt) {
        onChange(String(d.prompt));
        setState('idle');
      } else {
        setState('err');
      }
    } catch {
      setState('err');
    }
  };

  return (
    <button
      type="button"
      className={`prompt-boost ${state}`}
      onClick={() => void boost()}
      disabled={state === 'busy' || !value.trim()}
      title={state === 'err' ? t('art.boost.err') : t('art.boost.hint')}
      aria-label={t('art.boost.hint')}
    >
      {state === 'busy' ? '⏳' : '✨'}
    </button>
  );
}
