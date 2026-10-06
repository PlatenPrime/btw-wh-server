# Модуль Sku Chart Reports

## Назначение

JSON для графиков: сравнение агрегата SKU конкурента с Btrade (stock/sales), pie по производителям одного конкурента, pie по всем конкурентам и Btrade для одного производителя. Зависит от [sku-reporting](sku-reporting.md), [btrade-slices](btrade-slices.md), [arts](arts.md).

Потребители manufacturer rollup (нужен backfill/materialize за период):

- **manufacturers-pie** — `SkuManufacturerDaySales`;
- **prod-konks-pie** — competitor из Sku rollup (без `skugrIds`); Btrade из `BtradeManufacturerDaySales`; опционально `excludeKonks` вычитает konk/`btrade` из расчёта;
- **konk-prod/sales** — competitor + btrade sales/revenue без `skugrIds` из соответствующих rollup; stock — из сырых срезов.

С `skugrIds` и stock-chart sales-rollup не используется (нужен productId/artikul subset / stock).

## Эндпоинты

Базовый путь `/api/sku-chart-reports`. См. [API sku-chart-reports](../api/sku-chart-reports.md).

## Роли

ADMIN.
