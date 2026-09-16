# Модуль Analog Slices (Срезы аналогов по датам)

## Описание модуля

Модуль `analog-slices` хранит ежедневные срезы остатков (stock) и цен (price) аналогов по конкурентам. Один документ среза соответствует паре «конкурент + дата» и содержит объект `data`, в котором ключи — артикулы (artikul) аналогов, значения — объекты `{ stock, price }`. Срезы формируются по расписанию (cron) путём опроса данных по каждому аналогу конкурента из `ANALOG_SLICE_KONK_NAMES` (air, balun, sharte, yumi, yumin) с паузой `resolveAnalogSliceRequestDelayMs` (дефолт 1000 мс, для `air` — 2000 мс); для выборки по конкретному аналогу и дате или периоду используются контроллеры чтения. После среза каждого конкурента — отдельное Telegram-уведомление в analytics chat (с учётом отложенной ночной отправки до 06:00 Kyiv).

## Сущности модуля

### AnalogSlice (Срез аналогов)

Документ ежедневного среза по одному конкуренту. Поля: `konkName` — ключ конкурента (соответствует полю `name` в модели Konk и полю `konkName` в Analog); `date` — ключ календарного дня по `Europe/Kiev`, в БД хранится как `YYYY-MM-DDT00:00:00.000Z` (как строка даты из API); `data` — объект, ключи которого артикулы аналогов, значения — `{ stock: number, price: number, artikul?: string }`. Уникальный индекс: `(konkName, date)`.

## Связи между сущностями

- **Analog:** по `konkName` и артикулу (ключ в `data`) срез связан с аналогами. Для получения данных по одному аналогу используется его `_id`: по нему загружается аналог, из него берутся `konkName` и `artikul` для доступа к `data[artikul]` в документах срезов. У аналогов с пустым `artikul` записей в срезах нет — для них эндпоинты по аналогу возвращают 404.

## Концепции и принятые решения

### Нормализация даты

Ключ дня среза — календарная дата по стенным часам Киева (`Europe/Kiev`); в Mongo сохраняется та же форма, что и для query `YYYY-MM-DD`: полночь UTC той же строки даты (`toSliceDate` в утилитах). Так кроны по киевскому времени и запросы API сходятся на одном документе.

### Эндпоинты по аналогу и группе аналогов

- **Срез на одну дату:** по `analogId` (path) и `date` (query YYYY-MM-DD) возвращается одна точка `{ stock, price }`. Используется для карточки товара на конкретную дату.
- **Срез за период:** по `analogId` (path) и `dateFrom`, `dateTo` (query YYYY-MM-DD) возвращается массив `{ date, stock, price }[]`, отсортированный по дате. Формат удобен для построения графиков (в т.ч. Recharts / shadcn/ui).
- **Продажи на одну дату:** по `analogId` (path) и `date` (query YYYY-MM-DD) возвращается одна точка `{ sales, revenue, price, isDeliveryDay }`. Используется для графиков и карточек по продажам за день.
- **Продажи за период:** по `analogId` (path) и `dateFrom`, `dateTo` (query YYYY-MM-DD) возвращается массив `{ date, sales, revenue, price, isDeliveryDay }[]`, отсортированный по дате. Формат удобен для построения графиков продаж и выручки.
- **Excel analog vs Btrade (остатки и продажи):** те же таблицы, что раньше отдавали `*-excel` HTTP-роуты модуля. Сборка — kinds `analog-comparison`, `analog-sales-comparison`, `konk-btrade-comparison`, `konk-btrade-sales-comparison` в [excel-jobs](excel-jobs.md). Сами GET `*-excel` отвечают 410 с `kind`. Параметры те же: `analogId`+даты либо `konk`+`prod`+даты, опционально `abc`/`sortBy`.

## Роли доступа

Чтение JSON и 410-заглушки Excel: checkAuth + checkRoles(ADMIN). Фактическая выгрузка XLSX — ADMIN через [excel-jobs](excel-jobs.md).

## API эндпоинты

- **GET `/api/analog-slices`** — срез по конкуренту и дате (query: `konkName`, `date`). Возвращает весь объект среза (konkName, date, data). Доступ: USER.
- **GET `/api/analog-slices/analog/:analogId`** — срез по конкретному аналогу на одну дату (query: `date`). Ответ: `{ stock, price }`. Доступ: USER.
- **GET `/api/analog-slices/analog/:analogId/range`** — плотный ряд stock/price за период с forward-fill (query: `dateFrom`, `dateTo`). Ответ: массив `{ date, stock, price }[]`. Доступ: USER.
- **GET `/api/analog-slices/analog/:analogId/sales-by-date`** — продажи и выручка по аналогу на одну дату (query: `date`). Ответ: `{ sales, revenue, price, isDeliveryDay }`. Доступ: USER. См. [документацию для фронтенда](../frontend/analog-sales-charts.md).
- **GET `/api/analog-slices/analog/:analogId/sales-range`** — продажи и выручка по аналогу за период (query: `dateFrom`, `dateTo`). Ответ: массив `{ date, sales, revenue, price, isDeliveryDay }[]`. Доступ: USER. См. [документацию для фронтенда](../frontend/analog-sales-charts.md).
- **GET `/api/analog-slices/analog/:analogId/comparison-excel`** — 410, kind `analog-comparison`.
- **GET `/api/analog-slices/konk-btrade/comparison-excel`** — 410, kind `konk-btrade-comparison`.
- **GET `/api/analog-slices/analog/:analogId/sales-comparison-excel`** — 410, kind `analog-sales-comparison`.
- **GET `/api/analog-slices/konk-btrade/sales-comparison-excel`** — 410, kind `konk-btrade-sales-comparison`.
- **GET `/api/analog-slices/konk-btrade/sales-comparison`** — агрегированные продажи и выручка конкурента vs Btrade по дням за период (query: `konk`, `prod`, `dateFrom`, `dateTo`; опционально `abc`, `sortBy`). Данные суммарные по всем артикулам (не детализированные) — для построения графиков на фронтенде. Включает ежедневные показатели и итоговую секцию. Ответ: JSON. Доступ: USER. См. [документацию для фронтенда](../frontend/konk-btrade-sales-comparison.md).
- **GET `/api/analog-slices/konk-btrade/stock-comparison`** — агрегированные суммарные остатки конкурента vs Btrade по дням за период (query: `konk`, `prod`, `dateFrom`, `dateTo`; опционально `abc`, `sortBy`). Данные суммарные по всем артикулам — для построения графиков остатков на фронтенде. Включает ежедневные остатки и итоговую секцию с динамикой. Ответ: JSON. Доступ: USER. См. [документацию для фронтенда](../frontend/konk-btrade-stock-comparison.md).

Детальное описание запросов и ответов — в [API документации](../api/analog-slices.md). Фильтр и сортировка по ABC для групповых эндпоинтов konk-btrade — [../frontend/konk-btrade-abc-filter-sort.md](../frontend/konk-btrade-abc-filter-sort.md). Документация для фронтенда по эндпоинтам для графиков — [../frontend/analog-sales-charts.md](../frontend/analog-sales-charts.md), [../frontend/konk-btrade-sales-comparison.md](../frontend/konk-btrade-sales-comparison.md), [../frontend/konk-btrade-stock-comparison.md](../frontend/konk-btrade-stock-comparison.md).
