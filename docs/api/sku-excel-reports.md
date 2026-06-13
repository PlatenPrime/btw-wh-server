# API Excel-отчётов SKU

Базовый путь: `/api/sku-excel-reports`. Только XLSX-выгрузки. Форматы query и файлов — как у прежних маршрутов в `sku-slices` и `skus` (см. [миграцию](sku-api-migration.md)).

Доступ: checkAuth + checkRoles(ADMIN).

## Эндпоинты

### GET `/api/sku-excel-reports/catalog/new-since`

Excel SKU, созданных не раньше `since`.

**Query:** `konk` (string, обязательно; ключ конкурента или `all`), `since` (YYYY-MM-DD, обязательно).

**Ответ 200:** бинарный `.xlsx`.

---

### GET `/api/sku-excel-reports/catalog/invalid`

Excel SKU с `isInvalid=true`.

**Query:** `konk` (string, обязательно; ключ конкурента или `all`).

**Ответ 200:** бинарный `.xlsx`.

---

### GET `/api/sku-excel-reports/sku/:skuId/stock`

Excel остатков по одному SKU за период.

**Path:** `skuId` — ObjectId.

**Query:** `dateFrom`, `dateTo` (YYYY-MM-DD).

**Ответ 200:** бинарный `.xlsx`.

---

### GET `/api/sku-excel-reports/sku/:skuId/sales`

Excel продаж по одному SKU за период.

**Path / Query:** как у `stock`.

**Ответ 200:** бинарный `.xlsx`.

---

### GET `/api/sku-excel-reports/konk/stock`

Excel остатков по SKU конкурента и производителя.

**Query:** `konk`, `prod`, `dateFrom`, `dateTo`; опционально `skugrIds`.

**Ответ 200:** бинарный `.xlsx`.

---

### GET `/api/sku-excel-reports/konk/sales`

Excel продаж по SKU конкурента и производителя.

**Query:** как у `konk/stock`; опционально `sortBy` (`sales` | `revenue`).

**Ответ 200:** бинарный `.xlsx`.

---

### GET `/api/sku-excel-reports/skugr/:skugrId/stock`

Excel остатков по SKU из товарной группы.

**Path:** `skugrId` — ObjectId.

**Query:** `dateFrom`, `dateTo`.

**Ответ 200:** бинарный `.xlsx`.

---

### GET `/api/sku-excel-reports/skugr/:skugrId/sales`

Excel продаж по SKU из товарной группы.

**Path / Query:** как у `skugr/.../stock`.

**Ответ 200:** бинарный `.xlsx`.
