# API графиков артикула Btrade

Базовый путь: `/api/art-chart-reports`. JSON chart-data по одному артикулу из `BtradeSlice`.

Доступ: checkAuth + checkRoles(ADMIN).

## Эндпоинты

### GET `/api/art-chart-reports/artikul/:artikul/stock`

Ряд остатков (`quantity`) по дням.

**Path:** `artikul` — строка артикула.

**Query:** `dateFrom`, `dateTo` (YYYY-MM-DD).

**Ответ 200:** `{ message: string, data: { days, summary } }`, где:

- `days`: `Array<{ date: string, quantity: number }>`
- `summary`: `{ firstDayQuantity, lastDayQuantity, diffQuantity, diffQuantityPct }` (`diffQuantityPct` — `null` при нулевом остатке на первый день)

---

### GET `/api/art-chart-reports/artikul/:artikul/sales`

Ряд продаж и выручки по дням.

**Path / Query:** как у `stock`.

**Ответ 200:** `{ message: string, data: { days, summary } }`, где:

- `days`: `Array<{ date, sales, revenue, price, isDeliveryDay }>`
- `summary`: `{ totalSales, totalRevenue }`

**Ошибки (оба эндпоинта):** 400, 401, 403, 404 (артикул не найден), 500.
