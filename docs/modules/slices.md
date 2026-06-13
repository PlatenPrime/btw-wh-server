# Модуль Slices (Shared-утилиты срезов)

## Описание модуля

Модуль `slices` — **shared domain-модуль без HTTP и cron**. Он содержит общие конфигурации и утилиты, которые переиспользуют `analog-slices`, `sku-slices` и `slice-compensation`.

Тип модуля в архитектуре проекта: только `config/` + `utils/` + `__tests__/`.

## Содержимое

| Файл | Назначение |
|------|------------|
| [`config/excludedCompetitors.ts`](../../src/modules/slices/config/excludedCompetitors.ts) | Списки конкурентов, исключённых из cron срезов |
| [`utils/enumerateSliceDates.ts`](../../src/modules/slices/utils/enumerateSliceDates.ts) | Перечисление UTC-дней в диапазоне `from…to` |
| [`utils/isInvalidSliceStockResult.ts`](../../src/modules/slices/utils/isInvalidSliceStockResult.ts) | Правила сентинельных значений `-1` |
| [`utils/mapSliceDocsToRangeItems.ts`](../../src/modules/slices/utils/mapSliceDocsToRangeItems.ts) | Документы срезов → `{ date, stock, price }[]` |
| [`utils/salesComparisonUtils.ts`](../../src/modules/slices/utils/salesComparisonUtils.ts) | Продажи/выручка из рядов остатков, дни поставки |

## Концепции и принятые решения

### Исключения конкурентов

Конфиг `excludedCompetitors` задаёт per-type списки:

- `analogSlices` — сейчас пуст;
- `skuSlices` — например `yumi`.

Имена нормализуются через `normalizeCompetitorName` (trim + lowercase). Cron срезов и компенсации пропускают таких конкурентов.

### Контракт `-1`

`-1` в полях `stock` или `price` означает «данные недоступны». Полный провал скрапинга — оба поля `-1`. Утилита `isInvalidSliceStockResult` используется при сборке и компенсации срезов; для SKU дополнительно проверяется невалидная цена (`isInvalidSkuSliceDataItem` в `slice-compensation`).

### Продажи из остатков

`salesComparisonUtils` реализует расчёт продаж как разницу остатков между днями, учёт дней поставки (`isDeliveryDay`) и выручку — общая логика для Excel и JSON-отчётов в `analog-slices` и `sku-slices`.

### Диапазоны дат

`enumerateSliceDates` и `mapSliceDocsToRangeItems` обеспечивают единообразное построение временных рядов для chart-data и range-эндпоинтов.

## Связи между модулями

**Потребители:**

- `analog-slices` — range-маппинг, sales comparison, exclusions;
- `sku-slices` — cron, сырые read API, `sliceDataAggregationStages`;
- `sku-reporting` — shared utils/schemas для reporting-модулей;
- `sku-excel-reports`, `sku-sales-reports`, `sku-chart-reports` — HTTP-отчёты;
- `slice-compensation` — exclusions и семантика `-1`;
- `skus` — `runSkuInvalidFlagSync` использует правила invalid.

**Запрещено** импортировать `controllers/common/` другого slice-модуля — общий код выносится сюда (см. [project.mdc](../../.cursor/rules/project.mdc)).

## HTTP и cron

Отсутствуют. Модуль не регистрирует роуты и не запускает фоновые задачи.
