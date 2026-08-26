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

Cron ежедневно 20:00 Europe/Kiev; конкуренты из `slices/config/excludedCompetitors` (сейчас из sku-cron исключён `yumi`). Jitter из `resolveSkuSliceRequestJitterMs` (дефолт 500–1500 мс; для `air` — 1000–3000 мс). Ключ даты — `toNextKyivSliceDate`. После завершения среза **каждого** конкурента — отдельное Telegram-сообщение в analytics chat (ночное окно 20:00–05:59 откладывает отправку до 06:00 Kyiv); список excluded — отдельным сообщением в начале.

### Client-ingestion для Air

Параллельный канал к server scrape: срезы Air за **сегодня** (`toSliceDate`) можно дозаполнить с клиента через ADMIN API, если серверный опрос не дал валидных данных или оператор запускает ручной прогон:

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
