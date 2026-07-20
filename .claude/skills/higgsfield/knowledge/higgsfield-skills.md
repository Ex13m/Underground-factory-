# Реестр фирменных скилов Higgsfield (брать лучшее с сайта)

Этот скил — универсальный знаток скилов Higgsfield. Higgsfield публикует собственные
готовые скилы/воркфлоу; берём лучшие, применяем их логику через наш MCP, а сами скилы
можно и поставить пользователю. Пополнять этот файл при разборе новых уроков/релизов.

## Где искать (источники истины)
- Официальный репозиторий скилов: **github.com/higgsfield-ai/skills** (+ `INSTALL.md`, `CLAUDE.md`).
- Витрина: **higgsfield.ai/skills**.
- Marketplace «Supercomputer»: **higgsfield.ai/supercomputer/marketplace/skills**
  (устанавливаемые воркфлоу; страница JS-тяжёлая — точные имена доставать через
  WebSearch `site:higgsfield.ai/supercomputer/marketplace/skills` или из блога/README).
- CLI-каталог (не выдумывать имена!): `higgsfield model list`, `higgsfield workflow list`.

## Официальные скилы (репозиторий, 7 шт — УСТАНОВЛЕНЫ ГЛОБАЛЬНО 2026-07-20)
Поставлены глобально: `npx skills add higgsfield-ai/skills -g -a claude-code -s '*' -y`
→ `~\.claude\skills\higgsfield-*` (копии, доступны в ЛЮБОМ проекте; проектные дубли убраны).
Обновление: `npx skills update -g`. Живой каталог — 7 скилов (не 5): + game-generation,
+ video-explainer. Запускаются с полными правами агента — перед использованием
просматривать (инсталлятор пометил риск-оценку; Socket показал 0 алертов).
CLI требует настроенный Higgsfield-логин/ключ (`higgsfield ...`), это отдельно от нашего MCP.

| Скил | Команда | Что делает | Модели/инструменты | Когда |
|---|---|---|---|---|
| **higgsfield-soul-id** | `higgsfield soul-id create` | обучает личность из фото → `reference_id` | Soul training | первый шаг, если есть фото личности |
| **higgsfield-generate** | `higgsfield generate create <model>` | генерация, 30+ моделей, Marketing Studio, принимает `--soul-id` | text2image_soul_v2, soul_cinematic, draw_to_video, reframe | основная генерация; идёт после soul-id |
| **higgsfield-product-photoshoot** | `higgsfield product-photoshoot create` | брендовая товарная съёмка | gpt_image_2 | визуалы бренда без обучения Soul |
| **higgsfield-marketplace-cards** | `higgsfield marketplace-cards create` | карточки маркетплейса (main/secondary/A+) | переиспользует main-job через `--main-job` | листинги товара для e-commerce |
| **higgsfield-websites** | `higgsfield website build/edit/deploy` | фулстек-сайты | stack/auth/SEO/security | веб-проекты целиком |
| **higgsfield-game-generation** | — | генерация браузерных игр | пайплайн игр (get_game_creation_instructions) | браузерная игра под ключ |
| **higgsfield-video-explainer** | — | тема → faceless explainer-видео с визуалом и озвучкой | генерация видео + TTS | обучающий/промо-ролик без спикера |

Цепочка: «обучи Soul на фото И сделай видео» → сперва soul-id (`reference_id`), затем
`generate --soul-id …`. Установка: `/plugin marketplace add higgsfield-ai/skills` →
`/plugin install higgsfield@higgsfield`, либо `gh skill install higgsfield-ai/skills <skill>`.

## CLI `higgsfield` — памятка (для официальных скилов)
Залогинен 2026-07-20: `ex333m@gmail.com`, ultimate plan. Алиасы: `higgs`, `hf`.
- Вход (браузерный device-login, интерактивно — запускать через `! higgsfield auth login`);
  `higgsfield auth token` / `auth logout`.
- `higgsfield account status` — email/план/кредиты; `account transactions --size 50`.
- `higgsfield model list [--video|--image]` — каталог моделей и параметров.
- `higgsfield upload <файл>` → `upload_id`; `generate create <model> --prompt "..." --image <upload_id>`;
  `generate cost/list/wait`.
- Подкоманды: `soul-id`, `marketing-studio`, `product-photoshoot`, `marketplace-cards`, `workspace`.
- Флаг `--json` — сырой JSON (удобно парсить). CLI-логин отдельный от MCP-подключения.

## Marketplace-скилы (устанавливаемые воркфлоу — известные)
- **higgsfield-explainer** — любая тема → faceless explainer-видео с визуалом и озвучкой.
- **supercomputer-onboarding** — вводный воркфлоу платформы.
- **create-skill** — сборка собственного скила под пайплайн.
- Пакеты «commercial ad pipeline», «product demo», «trend research» — рекламный ролик /
  демо товара / разведка трендов «под ключ».
  _(точные слаги пополнять из marketplace/README при следующем разборе)_

## Специализированные скилы раскадровки (внешние, боевые)
- **higgsfield-seedance-shotlist-director** — генерит шотлист и по-сценные промпты
  строго в формате Seedance 2.0 (единый style-prefix + именованные блоки 1a/1b/2a…).
  Разобран в [lessons/2026-07-ai-ads-seedance.md](lessons/2026-07-ai-ads-seedance.md);
  логика вынесена в рецепт [playbooks/shotlist-seedance.md](playbooks/shotlist-seedance.md).
- Комьюнити-паки (референс, не обязательны): `higgsfield-ai-prompt-skill` (20 сабскилов:
  Cinema Studio 2.5/3.0/3.5, формула MCSLA, Soul ID консистентность, режимы промптов
  Seedance 2.0, Kling 3.0 Motion Control, Elements, DISCIPLINE-фреймворк).

## Как этот скил САМ выбирает, где сделать лучше
1. Классифицировать задачу: товар-фото / реклама-ролик / персонаж / explainer / карточки
   маркетплейса / сайт / раскадровка / оживление кадра / 3D / озвучка.
2. Есть фирменный скил/воркфлоу Higgsfield под это? → взять его логику (или предложить
   поставить сам скил). Нет → собрать из MCP-моделей по `knowledge/playbooks/` + `models.md`.
3. Сомнение по модели → `models_explore(recommend)`; сомнение по воркфлоу →
   `higgsfield workflow list` / WebSearch по сайту. Имена моделей/воркфлоу НЕ выдумывать.
