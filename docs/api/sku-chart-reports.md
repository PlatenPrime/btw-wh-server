# API графиков SKU vs Btrade

Базовый путь: `/api/sku-chart-reports`. JSON для chart-data и pie по конкуренту и производителю. Сравнение с Btrade через Art и BtradeSlice (см. [миграцию](sku-api-migration.md)).

Доступ: checkAuth + checkRoles(ADMIN).

## Эндпоинты

### GET `/api/sku-chart-reports/konk-prod/stock`

Ряды остатков: агрегат SKU конкурента vs Btrade.

**Query:** `konk`, `prod`, `dateFrom`, `dateTo`; опционально `skugrIds`. Режим `prod=all` поддерживается.

**Ответ 200:** `{ message: string, data: { days, summary } }` — форма как у analog konk-btrade stock-comparison.

---

### GET `/api/sku-chart-reports/konk-prod/sales`

Ряды продаж и выручки: конкурент vs Btrade.

**Query:** как у `konk-prod/stock`.

**Ответ 200:** `{ message: string, data: { days, summary } }` — форма как у analog sales-comparison.

---

### GET `/api/sku-chart-reports/konk-prod/manufacturers-pie`

Pie-агрегация продаж по производителям конкурента.

**Query:** `konk`, `dateFrom`, `dateTo`; опционально `skugrIds`.

**Ответ 200:** `{ message: string, data: Record<prodName, { title, salesPcs, salesUah }>, all: { title, salesPcs, salesUah } }`.
