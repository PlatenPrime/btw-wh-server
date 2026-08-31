# Модуль SKU Slices (Срезы SKU по датам)

## Назначение

Модуль хранит ежедневные **сырые** срезы остатков и цен по SKU конкурентов и запускает cron их сбора. Один документ — пара «конкурент + календарная дата» и объект `data` с ключами `Sku.productId`.

Отчётность (продажи, Excel, графики) вынесена в [sku-sales-reports](sku-sales-reports.md), [sku-excel-reports](sku-excel-reports.md), [sku-chart-reports](sku-chart-reports.md); общая логика — [sku-reporting](sku-reporting.md).

## Сущности

### SkuSlice

Поля: `konkName`, `date` (UTC-сутки), `data: Record<productId, { stock, price }>`. Уникальный индекс `(konkName, date)`.

## Связи

- **Sku** — ключи в `data` совпадают с `Sku.productId`.
- **Skugr** — cron и client-pending обходят только SKU из групп с `isSliced: true`.
- **browser** — серверный скрапинг через `getSkuStockDataUtil` (включая Air через impit); HTML-парсер Air также используется в client-ingestion.

## Сбор данных

Cron ежедневно 20:00 Europe/Kiev; конкуренты из `slices/config/excludedCompetitors` (сейчас из sku-cron исключён `yumi`; Air в primary cron остаётся). **Air rotation:** 3-дневный цикл — за один run server scrape только ~⅓ sliced SKU (`hash(productId) % 3 === dayIndex(sliceDate)`); полный каталог обновляется за 3 календарных дня Kyiv. На `SkuSlice` пишется `rotationMeta` (cycleDays, dayIndex, dueCount); в `data` только due-ключи (остальные отсутствуют, не `-1`). Jitter из `resolveSkuSliceRequestJitterMs` / `competitorScrapeProfiles` (дефолт 500–1500 мс; для `air` — 2000–5000 мс). Для Air — ярусы пауз без сложения: каждые 10 fetch кластер 20–40 с; каждые 100 — блок 4–6 мин; **чанки по 1000 HTTP fetch** с паузой 45–60 мин и `resetImpitClientCache` (на границе чанка jitter/cluster/block не ставятся). Следующий чанк только по pending (valid `data[productId]` skip без fetch). Несколько чанков подряд, пока не обработаны все pending или abort. Proactive chunk stop не увеличивает `errors`. Abort причины: Cloudflare `ORIGIN_BLOCKED` (520–526), unsupported konk, либо **15 подряд** soft-invalid (`-1`/null) — уже записанные ключи сохраняются, хвост не пишется как `-1` (pending видит missing). Soft-invalid и abort пишутся в Railway как warn/error; прогресс пауз — info. TG-итог по konk включает `abortReason`, если срез оборван. Ключ даты — `toNextKyivSliceDate`. После завершения среза **каждого** конкурента — отдельное Telegram-сообщение в analytics chat (ночное окно 20:00–05:59 откладывает отправку до 06:00 Kyiv); список excluded — отдельным сообщением в начале.

### Client-ingestion для Air

Параллельный канал к server scrape и **основной** способ дозаполнить хвост после abort/`-1` (server compensation для Air выключена): срезы Air за **сегодня** (`toSliceDate`) через ADMIN API. Pending только среди **due сегодня** rotation-bucket (тот же hash-контракт, что у cron):

1. `GET /client/air/pending` — очередь missing/`-1` среди due sliced Air SKU; в ответе `rotation: { cycleDays, dayIndex, dueCount }`;
2. `PUT /client/air/sku/:skuId` — HTML first-party страницы → `readAirProductFromHtml` → атомарный `$set` только если ключ отсутствует или содержит `-1` (иначе `skipped`).

Гайд для UI/расширения: [frontend: air-client-sku-slices](../frontend/air-client-sku-slices.md).

## HTTP

- `GET /api/sku-slices` — срез по konk+date с пагинацией
- `GET /api/sku-slices/sku/:skuId` — точка на дату
- `GET /api/sku-slices/sku/:skuId/range` — плотный ряд stock/price с forward-fill (без расчёта sales)
- `GET /api/sku-slices/client/air/pending` — очередь client-ingest
- `PUT /api/sku-slices/client/air/sku/:skuId` — запись точки из HTML

Подробности: [API sku-slices](../api/sku-slices.md).

## Роли

ADMIN.
