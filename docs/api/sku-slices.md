# API срезов SKU (Sku Slices)

Сырые ежедневные срезы остатков и цен по SKU конкурентов. Отчёты (продажи, Excel, графики) — в модулях [sku-sales-reports](sku-sales-reports.md), [sku-excel-reports](sku-excel-reports.md), [sku-chart-reports](sku-chart-reports.md). Миграция путей: [sku-api-migration](sku-api-migration.md).

Доступ: checkAuth + checkRoles(ADMIN).

## Эндпоинты

### GET `/api/sku-slices`

Срез по конкуренту и дате: постраничная выдача записей из поля `data` документа среза. Каждая запись сопоставляется с документом **Sku** по `productId`.

**Query:**

- `konkName` (string, обязательно)
- `date` (string, YYYY-MM-DD, обязательно)
- `page` (string, опционально) — по умолчанию `1`
- `limit` (string, опционально) — по умолчанию `10`, максимум `100`
- `isInvalid` (string, опционально) — `"true"` / `"false"`; при `true` только позиции для компенсирующих срезов

**Ответ 200:**

```text
{
  message: string,
  data: {
    konkName: string,
    date: Date (ISO),
    items: Array<{
      productId: string,
      stock: number,
      price: number,
      sku: Sku | null
    }>
  },
  pagination: { page, limit, total, totalPages, hasNext, hasPrev }
}
```

**Ошибки:** 400, 401, 403, 404, 500.

---

### GET `/api/sku-slices/sku/:skuId`

Одна точка остатка и цены по SKU на дату (значения из БД, без нормализации для отчётов).

**Path:** `skuId` — валидный ObjectId.

**Query:** `date` (YYYY-MM-DD, обязательно).

**Ответ 200:** `{ message: string, data: { stock: number, price: number } }`.

**Ошибки:** 400, 401, 403, 404, 500.

---

### GET `/api/sku-slices/sku/:skuId/range`

Массив точек среза по SKU за период (сырые значения из документов среза).

**Path:** `skuId` — валидный ObjectId.

**Query:** `dateFrom`, `dateTo` (YYYY-MM-DD, обязательно), `dateFrom` ≤ `dateTo`.

**Ответ 200:** `{ message: string, data: Array<{ date: string (ISO), stock: number, price: number }> }`.

**Ошибки:** 400, 401, 403, 404, 500.
