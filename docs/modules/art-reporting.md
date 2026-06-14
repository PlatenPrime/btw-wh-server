# Модуль Art Reporting (shared)

## Назначение

Shared domain-модуль без HTTP и cron. Общая логика отчётности по одному артикулу Btrade для модулей `art-sales-reports`, `art-chart-reports`, `art-excel-reports`.

## Содержимое

| Область | Назначение |
|---------|------------|
| `schemas/` | Общие Zod-схемы: `artikul`, диапазоны дат |
| `utils/coalesceBtradeSliceItemsForReporting` | Forward-fill `-1` для quantity/price |
| `utils/loadArtBtradeSliceSeries` | Загрузка рядов BtradeSlice по artikul с warm day |
| `utils/buildArtStockExcel`, `buildArtSalesExcel` | Сборка XLSX по одному артикулу |

## Связи

- **btrade-slices** — модель `BtradeSlice`, агрегация `aggregateBtradeSlices`
- **arts** — проверка существования артикула в каталоге
- **slices** — расчёт продаж из остатков
- **sku-reporting** — перечисление дат отчётности

Reporting-модули импортируют общий код только из `art-reporting`, не друг из друга.

## HTTP и cron

Отсутствуют.
