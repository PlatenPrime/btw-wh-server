# Модуль SKU Slices (Срезы SKU по датам)

## Назначение

Модуль хранит ежедневные **сырые** срезы остатков и цен по SKU конкурентов и запускает cron их сбора. Один документ — пара «конкурент + календарная дата» и объект `data` с ключами `Sku.productId`.

Отчётность (продажи, Excel, графики) вынесена в [sku-sales-reports](sku-sales-reports.md), [sku-excel-reports](sku-excel-reports.md), [sku-chart-reports](sku-chart-reports.md); общая логика — [sku-reporting](sku-reporting.md).

## Сущности

### SkuSlice

Поля: `konkName`, `date` (UTC-сутки), `data: Record<productId, { stock, price }>`. Уникальный индекс `(konkName, date)`.

## Связи

- **Sku** — ключи в `data` совпадают с `Sku.productId`.
- **Skugr** — cron обходит только SKU из групп с `isSliced: true`.
- **browser** — скрапинг через `getSkuStockDataUtil` в модуле [skus](skus.md).

## Сбор данных

Cron ежедневно 20:00 Europe/Kiev; конкуренты из `slices/config/excludedCompetitors`; jitter из `sku-reporting/constants`. Ключ даты — `toNextKyivSliceDate`.

## HTTP

Только чтение сырых срезов:

- `GET /api/sku-slices` — срез по konk+date с пагинацией
- `GET /api/sku-slices/sku/:skuId` — точка на дату
- `GET /api/sku-slices/sku/:skuId/range` — ряд stock/price без нормализации для продаж

Подробности: [API sku-slices](../api/sku-slices.md).

## Роли

ADMIN.
