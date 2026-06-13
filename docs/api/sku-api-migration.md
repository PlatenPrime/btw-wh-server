# Миграция API домена SKU (sku-slices split)

После реструктуризации отчётность вынесена из `sku-slices` и `skus` в отдельные модули. **Форматы query, path-параметров (кроме catalog) и тел ответов не менялись** — меняется только базовый путь.

## Таблица замены путей

| Было | Стало |
|------|--------|
| `GET /api/sku-slices` | без изменений |
| `GET /api/sku-slices/sku/:skuId` | без изменений |
| `GET /api/sku-slices/sku/:skuId/range` | без изменений |
| `GET /api/sku-slices/sku/:skuId/sales-by-date` | `GET /api/sku-sales-reports/sku/:skuId/by-date` |
| `GET /api/sku-slices/sku/:skuId/sales-range` | `GET /api/sku-sales-reports/sku/:skuId/range` |
| `GET /api/sku-slices/skugr/:skugrId/daily-summary` | `GET /api/sku-sales-reports/skugr/:skugrId/daily-summary` |
| `GET /api/sku-slices/konk-prod/skugr-groups-sales` | `GET /api/sku-sales-reports/konk-prod/skugr-groups-sales` |
| `GET /api/sku-slices/sku/:skuId/slice-excel` | `GET /api/sku-excel-reports/sku/:skuId/stock` |
| `GET /api/sku-slices/sku/:skuId/sales-excel` | `GET /api/sku-excel-reports/sku/:skuId/sales` |
| `GET /api/sku-slices/konk/excel` | `GET /api/sku-excel-reports/konk/stock` |
| `GET /api/sku-slices/konk/sales-excel` | `GET /api/sku-excel-reports/konk/sales` |
| `GET /api/sku-slices/skugr/:skugrId/slice-excel` | `GET /api/sku-excel-reports/skugr/:skugrId/stock` |
| `GET /api/sku-slices/skugr/:skugrId/sales-excel` | `GET /api/sku-excel-reports/skugr/:skugrId/sales` |
| `GET /api/skus/konk/:konkName/new-since-excel` | `GET /api/sku-excel-reports/catalog/new-since?konk=` |
| `GET /api/skus/konk/:konkName/invalid-excel` | `GET /api/sku-excel-reports/catalog/invalid?konk=` |
| `GET /api/sku-slices/konk-prod/stock-chart-data` | `GET /api/sku-chart-reports/konk-prod/stock` |
| `GET /api/sku-slices/konk-prod/sales-chart-data` | `GET /api/sku-chart-reports/konk-prod/sales` |
| `GET /api/sku-slices/konk-prod/manufacturers-pie-data` | `GET /api/sku-chart-reports/konk-prod/manufacturers-pie` |

## Catalog Excel: изменение параметров

Раньше ключ конкурента был в path (`konkName`), теперь — в query **`konk`** (то же значение, включая зарезервированное `all`).

- Новинки: `GET /api/sku-excel-reports/catalog/new-since?konk={name|all}&since=YYYY-MM-DD`
- Invalid: `GET /api/sku-excel-reports/catalog/invalid?konk={name|all}`

## Новые базовые пути

- `/api/sku-excel-reports` — все XLSX
- `/api/sku-sales-reports` — JSON продажи и агрегаты
- `/api/sku-chart-reports` — JSON для графиков

Доступ и роли — как у прежних маршрутов (ADMIN для reporting-модулей, см. [access-matrix](access-matrix.md)).

Детали форматов: [sku-slices](sku-slices.md), [sku-excel-reports](sku-excel-reports.md), [sku-sales-reports](sku-sales-reports.md), [sku-chart-reports](sku-chart-reports.md).
