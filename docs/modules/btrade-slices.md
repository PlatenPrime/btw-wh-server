# Модуль Btrade Slices (Срезы Btrade по датам)

## Описание модуля

Модуль `btrade-slices` хранит ежедневные срезы остатков и цен **собственного каталога Btrade** (sharik.ua). Source of truth точек — коллекция `btrade_slice_months`: один документ на `(artikul, month)`, дни месяца в `days[YYYY-MM-DD] → { price, quantity }`.

Срезы используются для внутренней аналитики Btrade, для сравнения с конкурентами в модуле `sku-slices` (графики и Excel «конкурент vs Btrade»), а также для отчётности по странице артикула в модулях [art-sales-reports](art-sales-reports.md), [art-chart-reports](art-chart-reports.md), [art-excel-reports](art-excel-reports.md); общая логика — [art-reporting](art-reporting.md).

## Сущности модуля

### BtradeSliceMonth

Документ month-шарда. Поля: `artikul`, `month` (UTC midnight 1-го числа), `days` — Mixed-карта дней с `{ price, quantity }` (включая sentinel `-1`).

Индексы: unique `(artikul, month)`; day-scan по `month`.

**Важно:** в срезах Btrade поле остатка называется `quantity`, тогда как в `analog-slices` и `sku-slices` используется `stock`.

### BtradeSlice (legacy)

Старый daily Mixed `(date)` + `data[artikul]`. Runtime больше не пишет и не читает точки отсюда. Коллекция нужна для CLI migrate/verify и cleanup legacy Mixed sales.

Срез — сырьё без derived sales. После записи дневных точек `calculateBtradeSlice` пересчитывает плоский manufacturer rollup `BtradeManufacturerDaySales` в [sku-reporting](sku-reporting.md) за `D`+`D+1` (формула `-1` → 0, без coalesce). Period/pie/chart sales по производителю читают rollup, не months.

Backfill rollup: `npx tsx src/modules/btrade-slices/scripts/runBackfillBtradeManufacturerSales.ts --from YYYY-MM-DD --to YYYY-MM-DD [--apply]`.

Migrate legacy Mixed → months: `npx tsx src/modules/btrade-slices/scripts/runMigrateAllBtradeSlicesToMonths.ts [--apply] [--verify-sample 100] [--no-verify]`. Dry-run по умолчанию; `--apply` пишет overwrite дней; verify сравнивает random legacy days с months.

Legacy Mixed salesPcs/salesUah снять: `npx tsx src/modules/sku-slices/scripts/runUnsetMixedSliceSales.ts --from … --to … [--apply]`.

## Связи между сущностями

- **Art:** список артикулов для среза формируется из distinct `artikul` коллекции `Art` (`getUniqueArtikulsFromArtsUtil`).
- **browser/sharik:** источник — bulk-страница `product_rests`; в срез пишется **sliceQuantity** (второй остаток в строке `artikul = actual; slice; price`).
- **sku-reporting / charts:** чтение Btrade через `btradeSliceMonthStore` / shim `aggregateBtradeSlices`.
- **analog-slices:** сравнение остатков и продаж аналога конкурента с Btrade в отчётах comparison.

## Концепции и принятые решения

### Month-шарды вместо daily Mixed

Один огромный документ на день с тысячами ключей `data` заменён на документы `(artikul, month)`. Day-wide чтение (admin GET, materialize) идёт по индексу `month` + ключ дня. Hard cutover: dual-write нет.

### Источник данных product_rests

Одна HTML-страница `product_rests` sharik.ua возвращает карту всех артикулов в формате `artikul = actualQuantity; sliceQuantity; price`. Для daily slice используется `sliceQuantity` и `price`. Артикулы, отсутствующие в карте, получают sentinel `{ price: -1, quantity: -1 }` (видны через `GET /api/btrade-slices?isInvalid=true`). Поисковый fallback удалён.

Запросы к sharik.ua идут без HTTP-прокси (geo-block снят; см. [browser](browser.md)). Общий in-memory cache TTL ~1ч живёт в `browser/sharik/utils/product-rests`.

Seed-артикул для URL: env `BTRADE_SHARIK_PRODUCT_RESTS_SEED_ARTIKUL` (по умолчанию `1302-0065`).

### Чтение для reporting

`aggregateBtradeSlices` / `sliceDataProjectForArtikulList` — thin shim над months store (форма `{ date, data }` сохранена для consumers). Предпочтительный путь — `loadBtradeSliceRowsForArtikuls` / `loadDayMap`.

### Нормализация даты

Ключ дня среза согласован с общим контрактом срезов: календарная дата по `Europe/Kiev`, хранение через `toSliceDate`; month/day keys — как у `sku_slice_months`.

## Сбор данных (cron)

- **Расписание:** ежедневно в **00:00 Europe/Kiev** (`startBtradeSlicesCron`).
- **Задача:** `calculateBtradeSlice()` — product_rests → `upsertDayPointsBulk` в months на текущий день → `afterBtradeSliceStockMutation`.
- **Отчёт:** Telegram-уведомление через `cron/analytics-notifications` после каждого запуска.

## HTTP

Модуль предоставляет только чтение (источник — months):

- **GET `/api/btrade-slices`** — постраничный срез на дату (`date`, `page`, `limit`, опционально `isInvalid`).
- **GET `/api/btrade-slices/artikul/:artikul/range`** — сырой ряд `quantity`/`price` по артикулу за период.

Подробности — в [API документации](../api/btrade-slices.md) и [матрице доступа](../api/access-matrix.md).
