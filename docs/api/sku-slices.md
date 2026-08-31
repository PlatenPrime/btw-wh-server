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

### GET `/api/sku-slices/client/air/pending`

Очередь Air SKU для клиентского дозаполнения сегодняшнего среза (календарный день `Europe/Kiev`). В выборку попадают только SKU из групп `Skugr` с `isSliced: true`. Позиция pending, если в `SkuSlice` за сегодня нет ключа `productId` или `stock === -1` / `price === -1`. Отсутствие документа среза = все sliced Air SKU pending.

**Ответ 200:**

```text
{
  message: string,
  data: {
    date: Date (ISO),
    items: Array<{
      skuId: string,
      productId: string,
      title: string,
      url: string
    }>
  }
}
```

**Ошибки:** 401, 403, 500.

---

### PUT `/api/sku-slices/client/air/sku/:skuId`

Идемпотентная запись точки сегодняшнего Air `SkuSlice` из HTML first-party страницы товара. Backend парсит HTML тем же контрактом, что `readAirProductFromHtml`. Канал параллелен серверному scrape: сервер к сайту Air при этом PUT не ходит.

**Path:** `skuId` — валидный ObjectId.

**Body:**

- `sourceUrl` (string, URL) — должен совпадать с `Sku.url` (нормализация: без hash, без завершающего `/` у path)
- `html` (string, 1…2_000_000 символов) — `outerHTML` страницы товара

**Ответ 200:**

```text
{
  message: string,
  data: {
    status: "saved" | "skipped",
    date: Date (ISO),
    productId: string,
    stock: number,
    price: number
  }
}
```

`saved` — ключ отсутствовал или содержал `-1`; `skipped` — валидное значение уже есть, перезаписи нет.

**Ошибки:** 400 (валидация / не air / не sliced / URL mismatch), 401, 403, 404 (sku не найден), 422 (HTML без валидных stock/price), 500.

---

### GET `/api/sku-slices/sku/:skuId`

Одна точка остатка и цены по SKU на дату (значения из БД, без нормализации для отчётов).

**Path:** `skuId` — валидный ObjectId.

**Query:** `date` (YYYY-MM-DD, обязательно).

**Ответ 200:** `{ message: string, data: { stock: number, price: number } }`.

**Ошибки:** 400, 401, 403, 404, 500.

---

### GET `/api/sku-slices/sku/:skuId/range`

Плотный массив точек среза по SKU за период: по каждому UTC-дню от `dateFrom` до `dateTo` включительно. Пропуски ключа в `data`, а также `-1` в stock/price заполняются forward-fill из последнего валидного значения (warm-start — день до `dateFrom`). До первого валидного среза в периоде — `stock: 0`, `price: 0`. Расчёт продаж не выполняется (см. sales-range).

**Path:** `skuId` — валидный ObjectId.

**Query:** `dateFrom`, `dateTo` (YYYY-MM-DD, обязательно), `dateFrom` ≤ `dateTo`.

**Ответ 200:** `{ message: string, data: Array<{ date: string (ISO), stock: number, price: number }> }` — длина массива = число календарных дней в диапазоне.

**Ошибки:** 400, 401, 403, 404, 500.
