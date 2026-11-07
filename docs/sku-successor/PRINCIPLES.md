# Принципы SKU-successor

## Frozen vs redesign

**Неприкасаемо (одна Mongo на оба проекта):**

- имена коллекций и набор полей документов из [FROZEN_MODELS.md](./FROZEN_MODELS.md);
- уникальные и составные индексы, перечисленные там;
- доменные инварианты (канон `productId`, unique `url` у Sku, `newsku`, правило `isInvalid`, семантика даты среза Kyiv).

**Можно и нужно менять в новом проекте:**

- границы директорий («модули» = папки, не Express 1:1);
- форма HTTP/RPC (closed API только для своего фронта; server functions / routes — на усмотрение DX);
- excel-пайплайн целиком с нуля;
- UX и структура экранов;
- раскладка scrapers: отдельная директория на конкурента + shared helpers;
- внутренние util/aggregation слои (логика отчётов может быть чище, пока пишет в те же rollup-коллекции).

`Prod` — **shared** со складом: любое изменение схемы `prods` сразу в обоих проектах и в `FROZEN_MODELS.md`.

## Closed API

Бэкенд successor общается только со своим фронтендом (same-origin server functions / свои server routes). Публичных scraper/stock URL как у текущего `/api/browser/*` в access-matrix — не делаем. Внешние chrome-extensions (Air ingest) — явные authenticated server routes, не «открытый» API.

## Auth v1

Как в текущем проекте: JWT + коллекции User/Role, иерархия ролей USER / EDITOR / ADMIN / PRIME. См. [docs/modules/auth.md](../modules/auth.md). Логин/регистрация и проверка ролей переносятся по смыслу 1:1; форма RPC может отличаться.

## Dual-run до дня Д

| Роль                                | Кто                                             |
| ----------------------------------- | ----------------------------------------------- |
| Writer в SKU/btrade/grabo коллекции | только `btw-wh-server`                          |
| Reader + UI/RPC против той же Mongo | successor (опционально)                         |
| Cron schedule                       | только старый; в successor `ENABLE_CRONS=false` |

Новый excel-пайплайн до дня Д **не пишет** в продовую коллекцию `exceljobs` (конфликт со старым worker). Либо отдельная коллекция для dev/staging, либо jobs только после cutover.

Один writer на коллекцию — жёсткое правило. Два cron materialize на одни `sku_slice_months` / rollups недопустимы.

## День Д

Переключение в **неактивном окне между ночными срезами** (после завершения sku-slice прогона, до следующего 20:00 Kyiv). См. [CRONS_AND_CUTOVER.md](./CRONS_AND_CUTOVER.md).

Порядок: stop SKU-периметровых cron в старом → enable cron в successor → переключение фронта → выпил SKU-модулей из `btw-wh-server` и старого React (отдельный этап). Analog compensation остаётся в складском процессе.

## Развитие до дня Д

`btw-wh-server` продолжает получать SKU-фичи. Каждое такое изменение фиксируется дельтой в [sync/](./sync/) и при необходимости обновляет frozen/capabilities/crons — чтобы successor не отставал от требований.
