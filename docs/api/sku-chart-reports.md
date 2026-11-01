# API графиков SKU vs Btrade

Базовый путь: `/api/sku-chart-reports`. JSON для chart-data и pie по конкуренту и производителю. Сравнение с Btrade через Art и `btrade_slice_months` (см. [миграцию](sku-api-migration.md)).

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

---

### GET `/api/sku-chart-reports/prod/konks-pie`

Pie-агрегация продаж по всем конкурентам и Btrade для одного производителя.

**Query:** `prod`, `dateFrom`, `dateTo`; опционально `excludeKonks` (массив или CSV имён `konkName`; значение `btrade` исключает сегмент Btrade).

**Ответ 200:** `{ message: string, data: Record<konkName | "btrade", { title, salesPcs, salesUah }>, all: { title, salesPcs, salesUah } }`.

Ключ `btrade` присутствует, если есть артикулы Art с этим `prodName` и `btrade` не в `excludeKonks`; `all` — сумма оставшихся сегментов.

---

### POST `/api/sku-chart-reports/selection/skus-pie`

Pie по произвольному списку SKU (в т.ч. разных конкурентов). Node compute из `SkuSliceMonth` (не manufacturer rollup).

**Body:**

| Поле       | Тип      | Обязательно | Описание                                   |
| ---------- | -------- | ----------- | ------------------------------------------ |
| `skuIds`   | string[] | да          | 1..100 Mongo ObjectId; порядок сохраняется |
| `dateFrom` | string   | да          | `YYYY-MM-DD`                               |
| `dateTo`   | string   | да          | `YYYY-MM-DD`, ≥ `dateFrom`                 |

**Ответ 200:**

```
{
  "message": string,
  "data": Record<skuId, {
    title: string,
    konkName: string,
    productId: string,
    salesPcs: number,
    salesUah: number,
    sharePcs: number,
    shareUah: number
  }>,
  "all": { title: "Всі обрані", salesPcs: number, salesUah: number }
}
```

`sharePcs` / `shareUah` — проценты 0..100 с 2 знаками от суммы выбранных. Отсутствующие id пропускаются; если ни одного SKU не найдено — 404. 400 при валидации.
