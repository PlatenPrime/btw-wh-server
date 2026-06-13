# Модуль SKU Reporting (shared)

## Описание

Модуль `sku-reporting` — **shared domain-модуль без HTTP и cron**. Общая логика отчётности по SKU-срезам для модулей `sku-excel-reports`, `sku-sales-reports`, `sku-chart-reports`.

Тип модуля: `schemas/` + `utils/` + `constants/` + `__tests__/`.

## Содержимое

| Область | Назначение |
|---------|------------|
| `schemas/` | Общие Zod-схемы: даты, диапазоны konk+prod, skugrIds |
| `utils/resolveKonkProdSkus` | Выборка SKU для konk-prod отчётов с опциональным skugrIds |
| `utils/skugrReporting` | Перечисление дат, карты срезов, загрузка Skugr со SKU |
| `utils/coalesceSkuSliceItemsForReporting` | Forward-fill `-1` для отчётов |
| `utils/aggregateDailySkuSliceMetricsForSkus` | Дневные суммы stock/sales/revenue по списку SKU |
| `utils/buildSkuSliceExcel` | Сборка XLSX по срезам |
| `utils/konkProdSkuChartCore` | Ряды конкурент vs Btrade для chart-data |
| `utils/prodDisplayTitles` | Заголовки производителей из Prod |
| `constants/skuSliceRequestJitterMs` | Пауза между HTTP при сборе/компенсации срезов |

## Связи

- **sku-slices** — модель `SkuSlice`, `sliceDataAggregationStages`
- **skus / skugrs / konks / prods / arts / btrade-slices** — доменные сущности для отчётов
- **slices** — математика продаж и invalid `-1`

Reporting-модули импортируют общий код только из `sku-reporting`, не друг из друга.

## HTTP и cron

Отсутствуют.
