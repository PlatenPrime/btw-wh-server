# Модуль SKU Slices (Срезы SKU по датам)

## Назначение

Модуль собирает и хранит **сырые** остатки и цены SKU конкурентов и запускает cron их сбора. Source of truth по точкам stock/price — месячные документы `SkuSliceMonth`. Observability дневного прогона (rotation, counters, abort) — slim `SkuSliceDayMeta`. Legacy коллекция `sku_slices` (дневной Mixed `data`) больше не используется runtime; остаётся только для one-shot миграции/verify.

Отчётность (продажи, Excel, графики) вынесена в [sku-sales-reports](sku-sales-reports.md), [sku-excel-reports](sku-excel-reports.md), [sku-chart-reports](sku-chart-reports.md); общая логика — [sku-reporting](sku-reporting.md).

## Сущности

### SkuSliceMonth

Один документ на `(konkName, productId, month)`, где `month` — UTC midnight 1-го числа, `days` — карта `YYYY-MM-DD → { stock, price }` (включая sentinel `-1`). Уникальный индекс `(konkName, productId, month)`; дополнительный `(konkName, month)` для day-wide scan.

Все write-пути (scrape, compensation, air ingest, PATCH, balun/svbum, pack-flip) и read-пути отчётов/API точек идут через store-слой months. После мутаций stock/price вызывается `afterSkuSliceStockMutation`: пересчёт manufacturer rollup (`SkuManufacturerDaySales` в [sku-reporting](sku-reporting.md)) за день `D` и `D+1`. Формула rollup: `stock === -1` → продажи дня = 0; рост остатка = поставка = 0; иначе `max(0, prev − curr)`; затем `Konk.recountDays`. Без forward-fill.

Backfill rollup: `npx tsx src/modules/sku-slices/scripts/runBackfillSkuSliceSales.ts --from YYYY-MM-DD --to YYYY-MM-DD [--konk name] [--apply]`.

### SkuSliceDayMeta

Slim документ `(konkName, date)` без точек: `rotationMeta`, `stats` (`filled` / `invalid` / `errorCount` / опционально `dueTotal`, `abortReason`). Пишется при scrape. Нужен для мониторинга «как прошёл день» без разворота всех month-доков.

### SkuSlice (legacy)

Дневной Mixed `data[productId]` — только источник для миграции в months. Runtime не пишет и не читает.

Полный перенос истории: `npx tsx src/modules/sku-slices/scripts/runMigrateAllSkuSlicesToMonths.ts [--apply] [--konk name] [--verify-sample 100] [--no-verify]`. Без `--apply` — dry-run с прогрессом `i/N` по каждому дневному срезу; с `--apply` — overwrite `days.*` и контрольная сверка 100 случайных срезов. Legacy `sku_slices` скрипт не удаляет.

Окноный materialize (устаревший helper): `runMaterializeSkuSliceMonths.ts --days-back …`.

## Связи

- **Sku** — `productId` совпадает с ключами в `SkuSliceMonth`.
- **Skugr** — cron и client-pending обходят только SKU из групп с `isSliced: true`.
- **browser** — серверный скрапинг через `getSkuStockDataUtil` (включая Air через impit); HTML-парсер Air также используется в client-ingestion.

## Сбор данных

Cron ежедневно 20:00 Europe/Kiev; конкуренты из `slices/config/excludedCompetitors` (сейчас из sku-cron исключён `yumi`; Air в primary cron остаётся). Rotation в `sliceRotationByKonk` сейчас пустая: Air берёт полный sliced-каталог за день. Jitter из `resolveSkuSliceRequestJitterMs` / `competitorScrapeProfiles`. Для Air — ярусы пауз и **чанки по 1000 HTTP fetch** с паузой 45–60 мин и `resetImpitClientCache`. Следующий чанк только по pending (valid точка в months skip без fetch). Abort: Cloudflare `ORIGIN_BLOCKED`, unsupported konk, либо **15 подряд** soft-invalid. TG-итог по konk включает `abortReason`. Ключ даты — `toNextKyivSliceDate`.

После срезов всех конкурентов — post-pass: balun fake stock, svbum fake stock, pack-flip auto-apply (`perfect`), manufacturer rollup. Ручные скрипты и ApiTask `sku-slices.post-corrections.run` без изменений по смыслу; запись точек — в months.

### Client-ingestion для Air

1. `GET /client/air/pending` — очередь missing/`-1` среди sliced Air SKU по сегодняшним точкам в months;
2. `PUT /client/air/sku/:skuId` — HTML → запись в months только если ключ отсутствует или `-1`.

Гайд: [frontend: air-client-sku-slices](../frontend/air-client-sku-slices.md).

## HTTP

- `GET /api/sku-slices` — **410** (legacy day-list); смотри day-status / day-invalid
- `GET /api/sku-slices/day-status` — meta/stats прогона + counts точек
- `GET /api/sku-slices/day-invalid` — пагинация invalid точек дня
- `GET /api/sku-slices/pack-flips` — проверка pack-flip за диапазон (без записи)
- `GET /api/sku-slices/sku/:skuId` — точка на дату
- `PATCH /api/sku-slices/sku/:skuId` — ручная запись stock/price (months upsert)
- `POST /api/sku-slices/skugr/:skugrId/run-today` — ручной scrape группы за сегодня
- `POST /api/sku-slices/post-corrections/run` — post-pass за период (ApiTask, 202)
- `GET /api/sku-slices/sku/:skuId/range` — плотный ряд с forward-fill
- `GET /api/sku-slices/client/air/pending` — очередь client-ingest
- `PUT /api/sku-slices/client/air/sku/:skuId` — запись точки из HTML

Подробности: [API sku-slices](../api/sku-slices.md).

## Роли

ADMIN.
