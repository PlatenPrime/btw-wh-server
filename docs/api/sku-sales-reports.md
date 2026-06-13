# API JSON-отчётов продаж SKU

Базовый путь: `/api/sku-sales-reports`. Продажи, выручка и агрегаты по Skugr. Нормализация `-1` и `Konk.recountDays` — как в прежнем `sku-slices` (см. [миграцию](sku-api-migration.md)).

Доступ: checkAuth + checkRoles(ADMIN).

## Эндпоинты

### GET `/api/sku-sales-reports/sku/:skuId/by-date`

Продажи и выручка по SKU на одну дату.

**Path:** `skuId` — ObjectId.

**Query:** `date` (YYYY-MM-DD).

**Ответ 200:** `{ message: string, data: { sales, revenue, price, isDeliveryDay } }`.

---

### GET `/api/sku-sales-reports/sku/:skuId/range`

Продажи и выручка по SKU за период.

**Path:** `skuId` — ObjectId.

**Query:** `dateFrom`, `dateTo` (YYYY-MM-DD), `dateFrom` ≤ `dateTo`.

**Ответ 200:** `{ message: string, data: Array<{ date, sales, revenue, price, isDeliveryDay }> }`.

---

### GET `/api/sku-sales-reports/skugr/:skugrId/daily-summary`

Дневные суммы остатков, продаж и выручки по товарной группе.

**Path:** `skugrId` — ObjectId.

**Query:** `dateFrom`, `dateTo`.

**Ответ 200:** `{ message: string, data: Array<{ date, stock, sales, revenue }> }`.

---

### GET `/api/sku-sales-reports/konk-prod/skugr-groups-sales`

Итоги продаж за период по каждой Skugr пары `konk` + `prod`.

**Query:** `konk`, `prod`, `dateFrom`, `dateTo`.

**Ответ 200:** `{ message: string, data: Array<{ skugrId, title, salesPcs, salesUah }>, all: { title, salesPcs, salesUah } }`.
