# Модуль SKU Reporting (shared)

## Описание

Модуль `sku-reporting` — **shared domain-модуль без HTTP и cron**. Общая логика отчётности по SKU-срезам для модулей `sku-excel-reports`, `sku-sales-reports`, `sku-chart-reports`.

Тип модуля: `schemas/` + `utils/` + `constants/` + `models/` + `__tests__/`.

## Содержимое

| Область | Назначение |
|---------|------------|
| `schemas/` | Общие Zod-схемы: даты, диапазоны konk+prod, skugrIds |
| `models/SkuManufacturerDaySales` | Плоский дневной rollup продаж конкурента по `(konkName, date, prodName)` |
| `models/BtradeManufacturerDaySales` | Плоский дневной rollup продаж Btrade по `(date, prodName)` (prodName lowercased) |
| `utils/resolveKonkProdSkus` | Выборка SKU для konk-prod отчётов с опциональным skugrIds |
| `utils/skugrReporting` | Перечисление дат, карты срезов, загрузка Skugr со SKU |
| `utils/coalesceSkuSliceItemsForReporting` | Forward-fill `-1` для stock/price в Excel/range; helpers дат |
| `utils/persistedSliceSalesUtils` | Формула sales на write-path rollup: `-1` → 0, delivery → 0, delta |
| `utils/materializeSkuSliceSalesUtil` | Пересчёт Sku manufacturer rollup за `D`+`D+1` / диапазон |
| `utils/materializeBtradeManufacturerSalesUtil` | Пересчёт Btrade manufacturer rollup за `D`+`D+1` / диапазон |
| `utils/stripMixedSliceSalesUtil` | Откат: снять legacy `salesPcs`/`salesUah` из Mixed data срезов |
| `utils/aggregateDailySkuSliceMetricsForSkus` | Дневные суммы: Node compute из stock (coalesce) |
| `utils/aggregatePeriodSkuSliceMetricsForSkus` | Периодные итоги по SKU: Node compute из stock |
| `utils/aggregateBtradeSalesForProdPeriod` | Период Btrade из `BtradeManufacturerDaySales` |
| `utils/aggregateManufacturerDaySales` | Read-path Sku rollup: by prodName / by konkName / daily |
| `utils/aggregateBtradeManufacturerDaySales` | Read-path Btrade rollup: period sum / daily |
| `utils/buildSkuSliceExcel` | Сборка XLSX по срезам |
| `utils/konkProdSkuChartCore` | Stock из Mixed; sales/revenue без skugrIds из Sku+Btrade rollup |
| `utils/prodDisplayTitles` | Заголовки производителей из Prod |
| `constants/skuSliceRequestJitterMs` | Пауза между HTTP при сборе/компенсации срезов |

## Агрегация продаж

**Ошибка materialize-in-Mixed:** раньше `salesPcs`/`salesUah` писались внутрь Mixed срезов. Это раздуло документы и не ускорило отчёты.

Текущая схема:

1. **Срезы** — сырьё `{ stock, price }` / `{ quantity, price }`.
2. **Sku manufacturer rollup** — `(konk, date, prodName)`; readers: manufacturers-pie, prod-konks-pie competitor, sales-chart competitor sales.
3. **Btrade manufacturer rollup** — `(date, prodName lowercased)`; readers: prod-konks-pie btrade, sales-chart btrade sales/revenue (без skugrIds).
4. **Stock, skugrIds/productId-пути, excel/by-date** — Node compute из сырых срезов.

CLI:

- Sku rollup: `npx tsx src/modules/sku-slices/scripts/runBackfillSkuSliceSales.ts --from … --to … [--konk] [--apply]`
- Btrade rollup: `npx tsx src/modules/btrade-slices/scripts/runBackfillBtradeManufacturerSales.ts --from … --to … [--apply]`
- unset Mixed legacy: `npx tsx src/modules/sku-slices/scripts/runUnsetMixedSliceSales.ts --from … --to … [--konk] [--apply]`

## Связи

- **sku-slices** — модель `SkuSlice`, хуки `afterSkuSliceStockMutation`
- **btrade-slices** — сырые срезы + хук `afterBtradeSliceStockMutation` → Btrade rollup
- **skus / skugrs / konks / prods / arts** — доменные сущности для отчётов
- **slices** — математика продаж (delta / recount / revenue)

Reporting-модули импортируют общий код только из `sku-reporting`, не друг из друга.

## HTTP и cron

Отсутствуют.
