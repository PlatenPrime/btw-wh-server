# API Excel-отчётов артикула Btrade

Базовый путь: `/api/art-excel-reports`. XLSX по одному артикулу за период.

Доступ: checkAuth + checkRoles(ADMIN).

## Эндпоинты

### GET `/api/art-excel-reports/artikul/:artikul/stock`

Excel остатков и цен по артикулу за период.

**Path:** `artikul` — строка артикула.

**Query:** `dateFrom`, `dateTo` (YYYY-MM-DD).

**Ответ 200:** бинарный `.xlsx`. Заголовки колонок дат: украинский день недели + `YYYY-MM-DD`.

---

### GET `/api/art-excel-reports/artikul/:artikul/sales`

Excel продаж, цен и выручки по артикулу за период.

**Path / Query:** как у `stock`.

**Ответ 200:** бинарный `.xlsx`.

**Ошибки (оба эндпоинта):** 400, 401, 403, 404 (артикул не найден), 500.
