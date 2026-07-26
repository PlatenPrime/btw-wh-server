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
- **browser** — серверный скрапинг через `getSkuStockDataUtil` для поддерживаемых конкурентов; для Air HTML-парсер используется только в client-ingestion.

## Сбор данных

Cron ежедневно 20:00 Europe/Kiev; конкуренты из `slices/config/excludedCompetitors` (в т.ч. `air` и `yumi` исключены из sku-cron). Jitter из `sku-reporting/constants`. Ключ даты — `toNextKyivSliceDate`.

### Client-ingestion для Air

Серверный scrape Air отключён (WAF). Срезы Air за **сегодня** (`toSliceDate`) дозаполняются через ADMIN API:

1. `GET /client/air/pending` — очередь missing/`-1` среди sliced Air SKU;
2. `PUT /client/air/sku/:skuId` — HTML first-party страницы → `readAirProductFromHtml` → атомарный `$set` только если ключ отсутствует или содержит `-1` (иначе `skipped`).

Гайд для UI/расширения: [frontend: air-client-sku-slices](../frontend/air-client-sku-slices.md).

## HTTP

- `GET /api/sku-slices` — срез по konk+date с пагинацией
- `GET /api/sku-slices/sku/:skuId` — точка на дату
- `GET /api/sku-slices/sku/:skuId/range` — ряд stock/price без нормализации для продаж
- `GET /api/sku-slices/client/air/pending` — очередь client-ingest
- `PUT /api/sku-slices/client/air/sku/:skuId` — запись точки из HTML

Подробности: [API sku-slices](../api/sku-slices.md).

## Роли

ADMIN.
