# API срезов аналогов (Analog Slices)

Эндпоинты для чтения ежедневных срезов остатков и цен аналогов по конкурентам. JSON-чтение: checkAuth + checkRoles(ADMIN). Маршруты `*-excel` отвечают **410** `EXCEL_JOBS_MIGRATED` — выгрузка через [excel-jobs](excel-jobs.md).

Для маршрутов продаж конкурента (`sales-by-date`, `sales-range`, `konk-btrade/sales-comparison` и kinds `analog-sales-comparison` / `konk-btrade-sales-comparison`) применяется календарь `Konk.recountDays`: на дату переучёта продажи и выручка конкурента принудительно считаются `0`, при этом дата не исключается из периода.

В Excel-отчётах analog/konk-btrade заголовки колонок по календарным дням оформлены так же, как в sku-slices: **украинское название дня недели, запятая, пробел и дата `YYYY-MM-DD`** (UTC-день).

## Эндпоинты

### GET `/api/analog-slices`

Получение среза по конкуренту и дате: весь документ среза (все артикулы конкурента за день).

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** query-параметры:

- `konkName`: string (обязательно)
- `date`: string (обязательно), формат YYYY-MM-DD

**Ответ 200:** `{ message: string, data: { konkName: string, date: Date, data: Record<string, IAnalogSliceDataItem> } }`, где ключи в `data` — артикулы, значения — `{ stock: number, price: number, artikul?: string }`.

**Ошибки:** 400 (невалидные параметры), 401, 403, 404 (срез не найден), 500.

---

### GET `/api/analog-slices/analog/:analogId`

Получение данных среза по конкретному аналогу на одну дату: одна точка (stock, price).

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path-параметр `analogId` — MongoDB ObjectId аналога. Query: `date` — string, формат YYYY-MM-DD (обязательно).

**Ответ 200:** `{ message: string, data: { stock: number, price: number } }`.

**Ошибки:** 400 (невалидный analogId или date), 401, 403, 404 (аналог не найден, у аналога пустой artikul или нет среза/записи на эту дату), 500.

---

### GET `/api/analog-slices/analog/:analogId/range`

Получение массива данных среза по аналогу за период дат (для графиков). Обе границы периода включительно.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path-параметр `analogId` — MongoDB ObjectId аналога. Query:

- `dateFrom`: string, YYYY-MM-DD (обязательно)
- `dateTo`: string, YYYY-MM-DD (обязательно), должна быть не раньше dateFrom

**Ответ 200:** `{ message: string, data: Array<{ date: string, stock: number, price: number }> }`. Поле `date` — строка в формате ISO (например `2026-03-01T00:00:00.000Z`). Массив отсортирован по дате по возрастанию. По каждому UTC-дню периода — одна точка; пропуски и `-1` заполняются forward-fill (warm-start — день до `dateFrom`); до первого валидного среза — `stock: 0`, `price: 0`.

**Ошибки:** 400 (невалидный analogId, даты или dateFrom > dateTo), 401, 403, 404 (аналог не найден или у аналога пустой artikul), 500.

---

### GET `/api/analog-slices/analog/:analogId/sales-by-date`

Получение продаж и выручки по аналогу на одну дату (для графиков). Продажи = разница остатка с предыдущим днём; выручка = продажи × цена на дату.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path-параметр `analogId` — MongoDB ObjectId аналога. Query: `date` — string, формат YYYY-MM-DD (обязательно).

**Ответ 200:** `{ message: string, data: { sales: number, revenue: number, price: number, isDeliveryDay: boolean } }`.

**Ошибки:** 400 (невалидный analogId или date), 401, 403, 404 (аналог не найден, у аналога пустой artikul или нет среза/записи на эту дату), 500.

---

### GET `/api/analog-slices/analog/:analogId/sales-range`

Получение массива продаж и выручки по аналогу за период дат (для графиков). Обе границы периода включительно. Каждый элемент: дата (ISO), продажи, выручка, цена, признак дня поставки.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path-параметр `analogId` — MongoDB ObjectId аналога. Query:

- `dateFrom`: string, YYYY-MM-DD (обязательно)
- `dateTo`: string, YYYY-MM-DD (обязательно), должна быть не раньше dateFrom

**Ответ 200:** `{ message: string, data: Array<{ date: string, sales: number, revenue: number, price: number, isDeliveryDay: boolean }> }`. Поле `date` — строка в формате ISO. Массив отсортирован по дате по возрастанию. В массив попадают только те даты, по которым есть срез и запись для артикула данного аналога.

**Ошибки:** 400 (невалидный analogId, даты или dateFrom > dateTo), 401, 403, 404 (аналог не найден или у аналога пустой artikul), 500.

---

### GET `/api/analog-slices/analog/:analogId/comparison-excel`

**410** `EXCEL_JOBS_MIGRATED`, kind `analog-comparison`. Params: `analogId`, `dateFrom`, `dateTo`. См. [excel-jobs](excel-jobs.md).

---

### GET `/api/analog-slices/konk-btrade/comparison-excel`

**410** `EXCEL_JOBS_MIGRATED`, kind `konk-btrade-comparison`. Params: `konk`, `prod`, `dateFrom`, `dateTo`; опционально `abc`, `sortBy`.

---

### GET `/api/analog-slices/analog/:analogId/sales-comparison-excel`

**410** `EXCEL_JOBS_MIGRATED`, kind `analog-sales-comparison`. Params: `analogId`, `dateFrom`, `dateTo`.

---

### GET `/api/analog-slices/konk-btrade/sales-comparison-excel`

**410** `EXCEL_JOBS_MIGRATED`, kind `konk-btrade-sales-comparison`. Params как у konk-btrade-comparison.

---

### GET `/api/analog-slices/konk-btrade/sales-comparison`

Получение агрегированных данных о продажах и выручке конкурента vs Btrade по дням за период. Данные суммарные по всем артикулам группы аналогов (не детализированные по каждому артикулу) — предназначены для построения графиков на фронтенде. Логика расчёта продаж и выручки та же, что в Excel-отчёте `sales-comparison-excel`: продажи = разница остатка с предыдущим днём, выручка = продажи × цена.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** только query-параметры:

- `konk`: string (обязательно) — ключ конкурента (`Konk.name`).
- `prod`: string (обязательно) — ключ производителя (`Prod.name`).
- `dateFrom`: string, YYYY-MM-DD (обязательно).
- `dateTo`: string, YYYY-MM-DD (обязательно), должно быть ≥ dateFrom.
- `abc`: string (опционально) — одна из букв `"A"`, `"B"`, `"C"`, `"D"`; фильтрация по наличию этой буквы в поле ABC артикула (без учёта регистра).
- `sortBy`: string (опционально) — значение `"abc"`; можно передавать с или без `abc`. При `sortBy=abc` порядок блоков: сначала по букве ABC (A → B → C → D), внутри буквы по числовой части ABC, затем по артикулу; без `sortBy` — по артикулу.

Итоги в `days` и `summary` считаются по отфильтрованным данным.

**Ответ 200:**

```json
{
  "message": "Sales comparison data retrieved successfully",
  "data": {
    "days": [
      {
        "date": "2026-03-01T00:00:00.000Z",
        "competitorSales": 12,
        "competitorRevenue": 3456.78,
        "btradeSales": 15,
        "btradeRevenue": 4200.50
      }
    ],
    "summary": {
      "totalCompetitorSales": 150,
      "totalBtradeSales": 180,
      "totalCompetitorRevenue": 45000.00,
      "totalBtradeRevenue": 52000.00,
      "diffSalesPcs": 30,
      "diffRevenueUah": 7000.00,
      "diffSalesPct": 20.00,
      "diffRevenuePct": 15.56
    }
  }
}
```

Описание полей:

- `days` — массив объектов по одному на каждый день периода (включая оба края), отсортированный по дате по возрастанию.
  - `date` — строка в формате ISO.
  - `competitorSales` — суммарные продажи конкурента (шт) по всем артикулам за этот день.
  - `competitorRevenue` — суммарная выручка конкурента (грн), округлена до 2 знаков.
  - `btradeSales` — суммарные продажи Btrade (шт) за день.
  - `btradeRevenue` — суммарная выручка Btrade (грн), округлена до 2 знаков.
- `summary` — итоговые показатели за весь период (те же данные, что в итоговом блоке Excel-отчёта):
  - `totalCompetitorSales` — суммарные продажи конкурента (шт).
  - `totalBtradeSales` — суммарные продажи Btrade (шт).
  - `totalCompetitorRevenue` — суммарная выручка конкурента (грн).
  - `totalBtradeRevenue` — суммарная выручка Btrade (грн).
  - `diffSalesPcs` — разница продаж: `totalBtradeSales − totalCompetitorSales` (шт).
  - `diffRevenueUah` — разница выручки: `totalBtradeRevenue − totalCompetitorRevenue` (грн).
  - `diffSalesPct` — разница продаж в процентах: `(btrade/competitor − 1) × 100`, округлено до 2 знаков. `null` при нулевых продажах конкурента.
  - `diffRevenuePct` — разница выручки в процентах: `(btrade/competitor − 1) × 100`, округлено до 2 знаков. `null` при нулевой выручке конкурента.

**Ошибки:**

- `400` — невалидные параметры (`konk`, `prod`, даты или dateFrom > dateTo); тело JSON: `{ message: "Validation error", errors: [...] }`.
- `401` — не авторизован.
- `403` — недостаточно прав.
- `404` — для заданной пары `konk`/`prod` не найдено ни одного аналога с непустым artikul либо после применения фильтра `abc` не осталось ни одного аналога; тело JSON: `{ message: "Analogs not found for provided konk/prod" }`.
- `500` — внутренняя ошибка сервера.

---

### GET `/api/analog-slices/konk-btrade/stock-comparison`

Получение агрегированных суммарных остатков конкурента vs Btrade по дням за период. Данные суммарные по всем артикулам группы аналогов (не детализированные по каждому артикулу) — предназначены для построения графиков на фронтенде. Для каждого дня суммируются остатки по всем аналогам выбранного конкурента и производителя.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** только query-параметры:

- `konk`: string (обязательно) — ключ конкурента (`Konk.name`).
- `prod`: string (обязательно) — ключ производителя (`Prod.name`).
- `dateFrom`: string, YYYY-MM-DD (обязательно).
- `dateTo`: string, YYYY-MM-DD (обязательно), должно быть ≥ dateFrom.
- `abc`: string (опционально) — одна из букв `"A"`, `"B"`, `"C"`, `"D"`; фильтрация по наличию этой буквы в поле ABC артикула (без учёта регистра).
- `sortBy`: string (опционально) — значение `"abc"`; можно передавать с или без `abc`. При `sortBy=abc` порядок: по букве ABC (A → B → C → D), внутри буквы по числовой части ABC, затем по артикулу; без `sortBy` — по артикулу.

Итоги в `days` и `summary` считаются по отфильтрованным данным.

**Ответ 200:**

```json
{
  "message": "Stock comparison data retrieved successfully",
  "data": {
    "days": [
      {
        "date": "2026-03-01T00:00:00.000Z",
        "competitorStock": 150,
        "btradeStock": 300
      }
    ],
    "summary": {
      "firstDayCompetitorStock": 150,
      "lastDayCompetitorStock": 120,
      "firstDayBtradeStock": 300,
      "lastDayBtradeStock": 270,
      "diffCompetitorStock": -30,
      "diffBtradeStock": -30,
      "diffCompetitorStockPct": -20.00,
      "diffBtradeStockPct": -10.00
    }
  }
}
```

Описание полей:

- `days` — массив объектов по одному на каждый день периода (включая оба края), отсортированный по дате по возрастанию.
  - `date` — строка в формате ISO.
  - `competitorStock` — суммарные остатки конкурента (шт) по всем артикулам за этот день. Если для артикула нет данных среза — считается как 0.
  - `btradeStock` — суммарные остатки Btrade (шт) за день. Если для артикула нет данных — считается как 0.
- `summary` — итоговые показатели за весь период:
  - `firstDayCompetitorStock` — суммарный остаток конкурента на первый день периода (шт).
  - `lastDayCompetitorStock` — суммарный остаток конкурента на последний день периода (шт).
  - `firstDayBtradeStock` — суммарный остаток Btrade на первый день периода (шт).
  - `lastDayBtradeStock` — суммарный остаток Btrade на последний день периода (шт).
  - `diffCompetitorStock` — изменение остатка конкурента: `lastDay − firstDay` (шт). Отрицательное значение означает уменьшение остатка.
  - `diffBtradeStock` — изменение остатка Btrade: `lastDay − firstDay` (шт).
  - `diffCompetitorStockPct` — изменение остатка конкурента в процентах: `(diff / firstDay) × 100`, округлено до 2 знаков. `null` при нулевом остатке на первый день.
  - `diffBtradeStockPct` — изменение остатка Btrade в процентах: `(diff / firstDay) × 100`, округлено до 2 знаков. `null` при нулевом остатке на первый день.

**Ошибки:**

- `400` — невалидные параметры (`konk`, `prod`, даты или dateFrom > dateTo); тело JSON: `{ message: "Validation error", errors: [...] }`.
- `401` — не авторизован.
- `403` — недостаточно прав.
- `404` — для заданной пары `konk`/`prod` не найдено ни одного аналога с непустым artikul либо после применения фильтра `abc` не осталось ни одного аналога; тело JSON: `{ message: "Analogs not found for provided konk/prod" }`.
- `500` — внутренняя ошибка сервера.

---

## Формат данных

- **IAnalogSliceDataItem:** `{ stock: number, price: number, artikul?: string }`.
- **Элемент массива range:** `{ date: string (ISO), stock: number, price: number }` — подходит для использования в компонентах графиков (Recharts, shadcn/ui Chart).
- **Ответ sales-by-date:** `{ sales: number, revenue: number, price: number, isDeliveryDay: boolean }`.
- **Элемент массива sales-range:** `{ date: string (ISO), sales: number, revenue: number, price: number, isDeliveryDay: boolean }`.
