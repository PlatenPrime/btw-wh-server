# API JSON-отчётов продаж артикула Btrade

Базовый путь: `/api/art-sales-reports`. Продажи и выручка по одному `Art.artikul` из `BtradeSlice`. Нормализация `-1` — через [art-reporting](../modules/art-reporting.md).

Доступ: checkAuth + checkRoles(ADMIN).

## Эндпоинты

### GET `/api/art-sales-reports/artikul/:artikul/by-date`

Продажи и выручка по артикулу на одну дату.

**Path:** `artikul` — строка артикула из каталога `Art`.

**Query:** `date` (YYYY-MM-DD).

**Ответ 200:** `{ message: string, data: { sales, revenue, price, isDeliveryDay } }`.

**Ошибки:** 400, 401, 403, 404 (артикул не найден или нет данных среза на дату), 500.

---

### GET `/api/art-sales-reports/artikul/:artikul/range`

Продажи и выручка по артикулу за период.

**Path:** `artikul` — строка артикула.

**Query:** `dateFrom`, `dateTo` (YYYY-MM-DD), `dateFrom` ≤ `dateTo`.

**Ответ 200:** `{ message: string, data: Array<{ date, sales, revenue, price, isDeliveryDay }> }`. Поле `date` — ISO string. Массив включает все дни периода (coalesce + warm day).

**Ошибки:** 400, 401, 403, 404 (артикул не найден), 500.
