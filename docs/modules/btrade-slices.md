# Модуль Btrade Slices (Срезы Btrade по датам)

## Описание модуля

Модуль `btrade-slices` хранит ежедневные срезы остатков и цен **собственного каталога Btrade** (sharik.ua). Один документ среза соответствует календарному дню и содержит объект `data`, в котором ключи — артикулы (`artikul`) из коллекции `Art`, значения — `{ price, quantity }`.

Срезы используются для внутренней аналитики Btrade, для сравнения с конкурентами в модуле `sku-slices` (графики и Excel «конкурент vs Btrade»), а также для отчётности по странице артикула в модулях [art-sales-reports](art-sales-reports.md), [art-chart-reports](art-chart-reports.md), [art-excel-reports](art-excel-reports.md); общая логика — [art-reporting](art-reporting.md).

## Сущности модуля

### BtradeSlice (Срез Btrade)

Документ дневного среза. Поля: `date` — начало суток (UTC, уникальный индекс); `data` — вложенный объект с ключами `artikul` и значениями `{ price, quantity }`.

**Важно:** в срезах Btrade поле остатка называется `quantity`, тогда как в `analog-slices` и `sku-slices` используется `stock`.

## Связи между сущностями

- **Art:** список артикулов для среза формируется из distinct `artikul` коллекции `Art` (`getUniqueArtikulsFromArtsUtil`).
- **browser/sharik:** основной источник данных — bulk-страница `product_rests` и поисковый fallback по отдельным артикулам (`getSharikStockData`, `fetchSharikProductRestsMap`).
- **sku-slices:** агрегация Btrade-срезов для chart-data и Excel (`aggregateBtradeSlices`, `sliceDataProjectForArtikulList`).
- **analog-slices:** сравнение остатков и продаж аналога конкурента с Btrade в отчётах comparison.

## Концепции и принятые решения

### Две стратегии получения данных

1. **Bulk-запрос** — одна HTML-страница `product_rests` sharik.ua возвращает карту всех остатков; это основной путь.
2. **Search-fallback** — для артикулов, не попавших в bulk-ответ, выполняется поштучный поиск с jitter 200–1000 мс между запросами.
3. **Sentinel missing** — если артикул не найден ни в bulk, ни в search, в `data` записывается `{ price: -1, quantity: -1 }`. Такие позиции попадают в Telegram-отчёт как `missing` и видны клиенту через `GET /api/btrade-slices?isInvalid=true`.

Seed-артикул для URL bulk-страницы задаётся через env `BTRADE_SHARIK_PRODUCT_RESTS_SEED_ARTIKUL` (по умолчанию `1302-0065`).

### Aggregation-проекция

Утилита `sliceDataProjectForArtikulList` сужает поле `data` в MongoDB-пайплайне до списка нужных артикулов — это снижает объём данных при chart-data и отчётах.

### Нормализация даты

Ключ дня среза согласован с общим контрактом срезов: календарная дата по `Europe/Kiev`, хранение через `toSliceDate`.

## Сбор данных (cron)

- **Расписание:** ежедневно в **00:00 Europe/Kiev** (`startBtradeSlicesCron`).
- **Задача:** `calculateBtradeSlice()` — обход артикулов, запись/обновление документа на текущий день. Для артикулов без данных после bulk и search в `data` пишется sentinel `-1/-1`.
- **Отчёт:** Telegram-уведомление через `cron/analytics-notifications` после каждого запуска.

## HTTP

Модуль предоставляет только чтение:

- **GET `/api/btrade-slices`** — постраничный срез на дату (`date`, `page`, `limit`, опционально `isInvalid` для фильтра «битых» позиций в `data`). Строки обогащаются документом **Art** по `artikul`; контракт ответа согласован с листингом `GET /api/sku-slices` (items + pagination), с полем остатка `quantity` вместо `stock`.
- **GET `/api/btrade-slices/artikul/:artikul/range`** — сырой ряд `quantity`/`price` по артикулу за период (без нормализации для продаж).

Подробности — в [API документации](../api/btrade-slices.md) и [матрице доступа](../api/access-matrix.md).
