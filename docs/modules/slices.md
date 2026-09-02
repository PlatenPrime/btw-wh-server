# Модуль Slices (Shared-утилиты срезов)

## Описание модуля

Модуль `slices` — **shared domain-модуль без HTTP и cron**. Он содержит общие конфигурации и утилиты, которые переиспользуют `analog-slices`, `sku-slices` и `slice-compensation`.

Тип модуля в архитектуре проекта: только `config/` + `utils/` + `__tests__/`.

## Содержимое

| Файл | Назначение |
|------|------------|
| [`config/excludedCompetitors.ts`](../../src/modules/slices/config/excludedCompetitors.ts) | Списки конкурентов: primary cron + compensation-only (`compensationExcludedCompetitors`) |
| [`config/sliceRotationByKonk.ts`](../../src/modules/slices/config/sliceRotationByKonk.ts) | Per-konk цикл среза (rotation): сколько дней и какой bucket сегодня |
| [`config/competitorScrapeProfiles.ts`](../../src/modules/slices/config/competitorScrapeProfiles.ts) | Throttle-профили скрапинга по konk и типу run |
| [`utils/sliceRotation.ts`](../../src/modules/slices/utils/sliceRotation.ts) | Bucket по `productId`, dayIndex по дате среза |
| [`utils/competitorScrapeThrottle.ts`](../../src/modules/slices/utils/competitorScrapeThrottle.ts) | Resolve профилей и задержки между unit/page/group |
| [`utils/enumerateSliceDates.ts`](../../src/modules/slices/utils/enumerateSliceDates.ts) | Перечисление UTC-дней в диапазоне `from…to` |
| [`utils/isInvalidSliceStockResult.ts`](../../src/modules/slices/utils/isInvalidSliceStockResult.ts) | Правила сентинельных значений `-1` |
| [`utils/mapSliceDocsToRangeItems.ts`](../../src/modules/slices/utils/mapSliceDocsToRangeItems.ts) | Документы срезов → `{ date, stock, price }[]` (sparse или dense с forward-fill) |
| [`utils/salesComparisonUtils.ts`](../../src/modules/slices/utils/salesComparisonUtils.ts) | Продажи/выручка из рядов остатков, дни поставки |

## Концепции и принятые решения

### Исключения конкурентов

Конфиг `excludedCompetitors` задаёт per-type списки для **primary cron** срезов:

- `analogSlices` — пусто; **primary cron analog-slices отключён** (сбор только через API/ручной триггер);
- `skuSlices` — `yumi`.

Отдельно `compensationExcludedCompetitors` + `getCompensationExcludedCompetitorSet` — union с cron-списком **только для компенсации**. Сейчас туда добавлен `air` (analog + sku): после Cloudflare 520 повторный серверный опрос бессмысленен; хвост дозаполняется через client-ingestion.

Имена нормализуются через `normalizeCompetitorName` (trim + lowercase). Primary cron смотрит только `excludedCompetitors`; compensation — union.

### Контракт `-1`

`-1` в полях `stock` или `price` означает «данные недоступны». Полный провал скрапинга — оба поля `-1`. Утилита `isInvalidSliceStockResult` используется при сборке и компенсации срезов; для SKU дополнительно проверяется невалидная цена (`isInvalidSkuSliceDataItem` в `slice-compensation`).

### Продажи из остатков

`salesComparisonUtils` реализует расчёт продаж как разницу остатков между днями, учёт дней поставки (`isDeliveryDay`) и выручку — общая логика для Excel и JSON-отчётов в `analog-slices` и `sku-slices`.

### Диапазоны дат

`enumerateSliceDates` перечисляет UTC-дни в диапазоне. `mapSliceDocsToRangeItems` строит временной ряд для range-эндпоинтов:

- без `range` — sparse: только даты с ключом в `data`;
- с `{ dateFrom, dateTo }` — dense: каждый день диапазона; forward-fill пропусков и `-1` (warm-start — день до `dateFrom`); до первого валидного значения — `0`.

Семантика валидной метрики: `isValidSliceMetricValue` (конечное число, не `-1`). Reporting coalesce использует ту же проверку; range API отдаёт `0` вместо `null` на leading gap.

### Rotation server-срезов (SKU)

Per-konk цикл в `sliceRotationByKonk` (сейчас пусто: Air без rotation, полный каталог за день). Bucket товара: `stableStringBucket(productId) % cycleDays`. Day index: календарный день Kyiv `% cycleDays`. Если у konk задан цикл — cron пишет в `SkuSlice.data` только due-bucket, `rotationMeta` на документе — observability, client-ingest фильтрует pending по тому же правилу.

### Throttle скрапинга конкурентов

`competitorScrapeProfiles` + `competitorScrapeThrottle` — единый источник jitter/pause для SKU-срезов, weekly skugr fill и group-pages pagination. Per-konk override в config map; runner'ы вызывают resolver, не hardcode `if (air)`.

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
