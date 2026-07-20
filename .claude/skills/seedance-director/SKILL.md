---
name: seedance-director
description: "Кинематографичный видео-режиссёр через технику Storyboard Grid: высокая плотность монтажа (16 склеек на 15-сек клип) за счёт сетки-раскадровки 4×4, которой Seedance 2.0 i2v якорит план движения. Провайдер-независимо: Replicate (primary) и Higgsfield MCP (fallback). Фазы: character sheet → environment plate → 4×4 grid → grid-to-video. Плюс cinema-director слой (intent→техника, формула шота, физика света) и beat-arc для не-экшена. Триггеры: /seedance-director, «сториборд-сетка», «storyboard grid», «плотный монтаж seedance», «раскадровка 4×4», «оживи по сетке», «high-cut-density видео». Для готовых рилсов с титрами/музыкой — reel-factory; здесь — режиссура и плотность склеек."
---

# SEEDANCE DIRECTOR — Storyboard Grid

> Техника high-cut-density видео через сетку-раскадровку.
> Источник знания: Generative-Media-Skills (MIT), адаптировано под Replicate + Reference Cluster.
> Провайдер-независимо: работает через Replicate (primary) и Higgsfield MCP (fallback).

## Принцип

Напряжение экшена — в плотности монтажа, а не в качестве одного кадра.
Seedance 2.0 i2v якорит план движения на визуальный референс: одна картинка-сетка
4×4 даёт модели 16 визуальных целей → 16 склеек в 15-секундном клипе.
Текстовое описание тех же 16 шотов усредняется в кашу. Поэтому сетка — изображением.

## Пайплайн (4 фазы)

### Phase A — Character sheet → @Image1
Модель: любая сильная t2i (GPT-Image-2 / Seedream / Nano Banana).

```
Character reference sheet of {CHARACTER}. Three views — front, 3/4, profile —
on a neutral grey backdrop. Studio lighting, full body, no text overlays,
photoreal. Asymmetric identifying details preserved on the correct side. {STYLE}.
```
Aspect: 3:2. Подтвердить identity глазами до продолжения.

**Правило асимметрии:** без деталей типа "scar over the right eyebrow",
"glove on the left hand only" дрейф identity между ячейками — failure mode №1.
Для Bohemian Trout: асимметрия уже есть в костюме (оранжево-бело-чёрный) —
зафиксировать сторону логотипа/акцентов явно.

### Phase B — Environment plate → @Image2
Модель с reasoning-композицией (Nano Banana 2 — лучше строит пространственную
логику: проходы, укрытия, линии взгляда).

```
Wide establishing shot of {ENVIRONMENT}. No characters in frame — environment only.
Strong perspective lines, depth, atmospheric haze. {STYLE}.
Production-design concept art.
```
Aspect: как у финального видео.

### Phase C — Сетка 4×4 → @Image3
Модель: i2i с двумя референсами (@Image1 + @Image2).

```
Compose a 4×4 storyboard grid (16 numbered cells) for the following action sequence:
{ACTION_SCRIPT}

CHARACTER (use reference image 1 identity throughout, asymmetric details preserved):
{CHARACTER}

LOCATION (use reference image 2 spatial layout):
{ENVIRONMENT}

Each cell labels: SHOT # (1–16) · SIZE (WIDE / MS / CU / ECU) ·
CAMERA-MOVE arrow (push, pull, whip, dolly, crash-zoom, handheld) ·
1-word RHYTHM note (BEAT / IMPACT / RECOVERY / RESET).

Vary shot size aggressively — never two WIDEs in a row.
Land every IMPACT on a CU or ECU.
Hand-drawn comic-book ink-and-wash style, monochrome with selective accents.
Numbered cells, clear gutters between panels.

Aesthetic: {STYLE}.
```
Aspect: 1:1 (квадрат оптимален для 4×4).

Проверка: 16 шотов читаются; identity стабильна; вариация размеров агрессивная.
Плохая ячейка → регенерация сетки с усилением: "CELL 7 must be an ECU on ...".

### Phase D — Сетка → видео (Seedance 2.0 i2v)
Reference: @Image3 (сетка).

```
Generate a {DURATION}-second sequence that strictly follows the 16-cell
storyboard reference image, cell-by-cell, top-left to bottom-right.

- Honour each cell's labelled SHOT SIZE and CAMERA-MOVE — match cuts to the
  storyboard's rhythm notes.
- Strong cinematic feel and shot language. {DYNAMICS_NOTE}.
- Camera language: anamorphic, handheld where the storyboard calls for it,
  locked-off where it doesn't.
- Native audio: sfx on every IMPACT cell, ambient foley, restrained score.

Action being rendered: {ACTION_SCRIPT}.
Aesthetic: {STYLE}.
```

Экономика: драфт на 480p-варианте → полный рендер только после одобрения.
Слабое соответствие сетке → сначала регенерировать Phase D с усилением
"strict cell-by-cell adherence" (дешевле, чем перестраивать сетку).

## Chaining для длинных сцен

Сетка A (cells 1–16, 0–15s) → сетка B (cells 17–32, 15–30s),
где первая ячейка B = последняя ячейка A (якорь непрерывности).
Совместимо с segment chaining в run_pipeline.py: сетка = сегментный референс.

## Intent → техника (cinema-director слой)

| Намерение | Framing | Движение | Свет |
|---|---|---|---|
| Heroic reveal | Low angle / Wide | Crane up / Orbit | Rim lighting, high contrast |
| Tense / uneasy | Dutch angle | Handheld shake | Low key, harsh shadows |
| Introspective | Close-up | Slow push in | Soft Rembrandt, window light |
| Majestic / epic | Extreme wide | Drone flyover | Golden hour, volumetric |
| Melancholic | Profile / Medium | Slow pull out | Blue hour, desaturated |

Формула шота: `[Shot Type] + [Subject/Action] + [Environment] + [Lighting] +
[Camera Movement] + [Lens Effect]`.

Физика света в промпте триггерит reasoning модели:
"neon reflections shimmering on rain-slicked asphalt" > "neon lights".

Запреты: не совмещать противоречивые движения (Dolly In + Dolly Out);
не трансформировать субъект внутри одного шота; предпочитать движения,
возможные на реальном оборудовании (даёт "плёночный" вид).

Смещения моделей: Veo — медленные эстетские шоты; Kling — сложная моторика
персонажей и физика; Seedance 2.0 — плотный монтаж по визуальному референсу.

## Beat-arc для не-экшена (сториборд любых сюжетов)

Декомпозиция концепта на N битов с дугой:
setup → inciting moment → escalation → climax → resolution.
Описание персонажа повторяется дословно в каждом промпте ячейки —
не полагаться на память модели.

Скелет 12 битов (для рекламных/атмосферных роликов):
1. Establishing wide — мир и тон
2. Push in on subject — хук
3. Detail insert — ключевой объект
4. Reaction / motion beat — ставки
5. Turn — твист / reveal
6. Payoff — пик
7. Pull back — масштаб
8. Signature close — лого / финал
(9–12 опционально: transition, texture, hero framing, resolution)

## Применение: Bohemian Trout SUP

ACTION_SCRIPT-пример: "SUP push-off from sandbar → paddle rhythm builds →
splash detail ECU → heron flyby reaction → glide into estuary current →
silhouette against sun → board carve turn → logo close on suit patch".
IMPACT-ячейки: splash, carve turn. Сетка B — продолжение в море.

## Провайдеры (как исполнять фазы этим окружением)

- **Replicate (primary)** — через скилл `replicate`: Recraft/FLUX/Seedream для
  референсов, `bytedance/seedance-...` (i2v) для Phase D. Нужен `REPLICATE_API_TOKEN`.
- **Higgsfield MCP (fallback)** — `nano_banana_pro` для character sheet / environment /
  сетки (role `image` для i2i), `seedance_2_0` для Phase D (`medias` role `start_image` =
  сетка). Всегда доступен без токена.
- Опрашивать статусы: Replicate — `Prefer: wait` или polling; Higgsfield —
  `job_status sync:true`. Драфт дёшево (480p / fast), полный рендер — по одобрению.
