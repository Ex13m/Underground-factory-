/**
 * ImageGen — адаптеры генерации картинок для арт-редактора.
 * Провайдеры: OpenAI GPT Image и Google Nano Banana 2 (Gemini image).
 * Ключи вводятся админом и живут в localStorage (uf:genkeys) — как и весь
 * прототип, слой заменяется на серверный прокси без изменения интерфейса.
 */

export type GenProvider = 'pollinations' | 'openai' | 'gemini';

export interface GenKeys {
  openai?: string;
  gemini?: string;
  /** единый ключ Replicate (r8_…) — модели nano-banana / gpt-image / flux через /api/generate */
  replicate?: string;
  /** провайдер по умолчанию для панели */
  provider?: GenProvider;
}

const KEYS_LS = 'uf:genkeys';

/** Последние известные модели; при смене поколения меняются только эти константы. */
const OPENAI_MODEL = 'gpt-image-1';
const GEMINI_MODEL = 'gemini-3-pro-image-preview'; // Nano Banana 2
const GEMINI_FALLBACK_MODEL = 'gemini-2.5-flash-image'; // Nano Banana 1

export function readGenKeys(): GenKeys {
  try {
    return JSON.parse(localStorage.getItem(KEYS_LS) ?? '{}') as GenKeys;
  } catch {
    return {};
  }
}

export function writeGenKeys(patch: Partial<GenKeys>) {
  localStorage.setItem(KEYS_LS, JSON.stringify({ ...readGenKeys(), ...patch }));
}

/**
 * Стилевой референс: собран из дизайн-токенов сайта (global.css / design_tokens
 * Stitch) — подмешивается к промпту, чтобы новые картинки не выбивались из стиля.
 */
export const STYLE_SUFFIX =
  'Style: cyber-industrial techwear, underground JDM tuning workshop at night. ' +
  'Palette: blood red #e01b22, deep black, dirty paper-white. Carbon fibre texture, ' +
  'HUD plates with cut corners, japanese stencil glyphs, warning tape decals, ' +
  'film grain, harsh rim light, high-contrast editorial product photography.';

/** Автоподбор размера под пропорции элемента на странице. */
function openaiSize(w: number, h: number): '1024x1024' | '1536x1024' | '1024x1536' {
  const r = w / Math.max(1, h);
  if (r >= 1.2) return '1536x1024';
  if (r <= 0.8) return '1024x1536';
  return '1024x1024';
}

const GEMINI_RATIOS: Array<[string, number]> = [
  ['21:9', 21 / 9], ['16:9', 16 / 9], ['3:2', 1.5], ['4:3', 4 / 3], ['5:4', 1.25],
  ['1:1', 1], ['4:5', 0.8], ['3:4', 0.75], ['2:3', 2 / 3], ['9:16', 9 / 16],
];

function geminiAspect(w: number, h: number): string {
  const r = w / Math.max(1, h);
  let best = GEMINI_RATIOS[0];
  for (const c of GEMINI_RATIOS) if (Math.abs(c[1] - r) < Math.abs(best[1] - r)) best = c;
  return best[0];
}

function b64ToBlob(b64: string, mime: string): Blob {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function blobToB64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve((r.result as string).split(',')[1]);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export interface GenRequest {
  provider: GenProvider;
  prompt: string;
  /** подмешать стилевой референс сайта */
  useStyle: boolean;
  /** визуальные референсы: текущая картинка, другие фото объекта и т.д. */
  references?: Blob[];
  /** размеры элемента на странице — для автоподбора формата */
  width: number;
  height: number;
}

/** API принимают только растр — SVG-референсы (наш fallback-арт) прогоняем через canvas. */
async function rasterize(blob: Blob, w: number, h: number): Promise<Blob | undefined> {
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(64, Math.round(w));
    canvas.height = Math.max(64, Math.round(h));
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? undefined), 'image/png'));
  } catch {
    return undefined;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function generateImage(req: GenRequest): Promise<Blob> {
  const keys = readGenKeys();
  const prompt = req.useStyle ? `${req.prompt}\n\n${STYLE_SUFFIX}` : req.prompt;
  const references: Blob[] = [];
  for (const r of req.references ?? []) {
    const raster = r.type.includes('svg') ? await rasterize(r, req.width, req.height) : r;
    if (raster) references.push(raster);
  }
  if (req.provider === 'pollinations') {
    return pollinationsGenerate(prompt, req.width, req.height);
  }
  if (req.provider === 'openai') {
    // нет ключа — не ругаемся, а тихо генерим бесплатным (прототип должен работать сразу)
    if (!keys.openai) return pollinationsGenerate(prompt, req.width, req.height);
    return references.length
      ? openaiEdit(keys.openai, prompt, references, req.width, req.height)
      : openaiGenerate(keys.openai, prompt, req.width, req.height);
  }
  if (!keys.gemini) return pollinationsGenerate(prompt, req.width, req.height);
  return geminiGenerate(keys.gemini, prompt, references, req.width, req.height);
}

/**
 * Pollinations — бесплатная генерация без ключа: картинка живёт прямо по URL.
 * Простейший автономный путь: браузер показывает URL обычным <img>,
 * «Применить» сохраняет саму ссылку (см. mediaStore.setUrlOverride) —
 * никакого скачивания кодом, ломаться нечему.
 */
export function pollinationsUrl(prompt: string, w: number, h: number): string {
  const px = (n: number) => Math.max(256, Math.min(1600, Math.round(n) * 2));
  const seed = Math.floor(Math.random() * 1e9); // новый вариант при каждом запуске
  return (
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
    `?width=${px(w)}&height=${px(h)}&seed=${seed}&nologo=true&model=flux&enhance=true`
  );
}

/** Собрать финальный промпт с учётом стилевого суффикса сайта. */
export function finalPrompt(prompt: string, useStyle: boolean): string {
  return useStyle ? `${prompt}\n\n${STYLE_SUFFIX}` : prompt;
}

async function pollinationsGenerate(prompt: string, w: number, h: number): Promise<Blob> {
  const res = await fetch(pollinationsUrl(prompt, w, h));
  if (!res.ok) throw new Error(`Pollinations HTTP ${res.status}`);
  const blob = await res.blob();
  if (!blob.type.startsWith('image/')) throw new Error('Pollinations: не картинка в ответе');
  return blob;
}

async function openaiGenerate(key: string, prompt: string, w: number, h: number): Promise<Blob> {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: OPENAI_MODEL, prompt, size: openaiSize(w, h), n: 1 }),
  });
  return parseOpenai(res);
}

async function openaiEdit(key: string, prompt: string, references: Blob[], w: number, h: number): Promise<Blob> {
  const form = new FormData();
  form.append('model', OPENAI_MODEL);
  form.append('prompt', prompt);
  form.append('size', openaiSize(w, h));
  references.forEach((r, i) => form.append('image[]', r, `reference-${i}.png`));
  const res = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  return parseOpenai(res);
}

async function parseOpenai(res: Response): Promise<Blob> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message ?? `OpenAI HTTP ${res.status}`);
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error('OpenAI: пустой ответ без картинки');
  return b64ToBlob(b64, 'image/png');
}

async function geminiGenerate(
  key: string,
  prompt: string,
  references: Blob[],
  w: number,
  h: number,
): Promise<Blob> {
  const parts: any[] = [{ text: prompt }];
  for (const reference of references) {
    parts.push({
      inline_data: { mime_type: reference.type || 'image/png', data: await blobToB64(reference) },
    });
  }
  if (references.length) parts[0].text += '\nUse the attached images as visual style references.';
  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ['IMAGE'],
      imageConfig: { aspectRatio: geminiAspect(w, h) },
    },
  };
  const call = (model: string) =>
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body),
    });

  let res = await call(GEMINI_MODEL);
  // новая модель может быть недоступна на ключе — откатываемся на предыдущую банану
  if (res.status === 404 || res.status === 403) res = await call(GEMINI_FALLBACK_MODEL);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message ?? `Gemini HTTP ${res.status}`);
  const inline = data?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData ?? p.inline_data);
  const img = inline?.inlineData ?? inline?.inline_data;
  if (!img?.data) throw new Error('Gemini: пустой ответ без картинки');
  return b64ToBlob(img.data, img.mimeType ?? img.mime_type ?? 'image/png');
}

/**
 * Опознание тачки по фото (Gemini vision, нужен свой ключ):
 * возвращает { name, passport } — марка/модель и «паспорт» в стиле цеха.
 */
export async function geminiIdentifyCar(
  key: string,
  jpegBase64: string,
): Promise<{ name: string; passport: string }> {
  const body = {
    contents: [
      {
        parts: [
          { inline_data: { mime_type: 'image/jpeg', data: jpegBase64 } },
          {
            text:
              'Опознай автомобиль на фото. Ответь СТРОГО одним JSON без пояснений: ' +
              '{"name":"Марка Модель (поколение или годы)","passport":"краткий паспорт машины по-русски в дерзком стиле андеграунд-гаража: цвет, кузов, диски, характерные детали — одна-две фразы"}',
          },
        ],
      },
    ],
  };
  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body),
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message ?? `Gemini HTTP ${res.status}`);
  const text: string =
    data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('') ?? '';
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('Gemini: ответ без JSON');
  const parsed = JSON.parse(m[0]) as { name?: string; passport?: string };
  if (!parsed.name) throw new Error('Gemini: не опознал машину');
  return { name: parsed.name, passport: parsed.passport ?? '' };
}

/** Достать текущую картинку как блоб для референса (best-effort: CORS может не пустить). */
export async function fetchAsBlob(src: string): Promise<Blob | undefined> {
  try {
    const res = await fetch(src);
    if (!res.ok) return undefined;
    const blob = await res.blob();
    return blob.size > 0 ? blob : undefined;
  } catch {
    return undefined;
  }
}
