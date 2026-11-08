# API Sku Stock Bands

Базовый путь: `/api/sku-stock-bands`. Сохранённые диапазоны аномального остатка по конкурентам.

Доступ: checkAuth + checkRoles(ADMIN) на всех методах.

DTO диапазона:

```text
{
  _id: string,
  konk: { name: string, title: string },
  stockMin: number,
  stockMax: number,
  normalMax: number,
  createdAt: Date,
  updatedAt: Date
}
```

Инварианты: `stockMin ≤ stockMax`, `normalMax < stockMin`, все ≥ 0 finite. `konk.title` всегда из документа `Konk` на create/смене konk.

---

### GET `/api/sku-stock-bands`

Список диапазонов, сортировка `konk.name`, `stockMin`.

**Query:** `konkName?` — trim + lowercase; без параметра — все.

**Ответ 200:** `{ message: string, data: Array<SkuStockBandDto> }`

**Ошибки:** 400, 401, 403, 500.

---

### GET `/api/sku-stock-bands/:id`

**Ответ 200:** `{ message: string, data: SkuStockBandDto }`

**Ошибки:** 400, 401, 403, 404, 500.

---

### POST `/api/sku-stock-bands`

**Тело:**

| Поле      | Тип    | Обязательно | Описание           |
| --------- | ------ | ----------- | ------------------ |
| konkName  | string | да          | trim + lowercase   |
| stockMin  | number | да          | ≥ 0                |
| stockMax  | number | да          | ≥ stockMin         |
| normalMax | number | да          | ≥ 0 и `< stockMin` |

**Ответ 201:** `{ message: string, data: SkuStockBandDto }`

**Ошибки:** 400; 404 нет Konk; 401; 403; 500.

---

### PATCH `/api/sku-stock-bands/:id`

Частичное обновление. Хотя бы одно поле обязательно.

**Тело (все опциональны):** `konkName`, `stockMin`, `stockMax`, `normalMax`. После merge применяются те же инварианты.

**Ответ 200:** `{ message: string, data: SkuStockBandDto }`

**Ошибки:** 400 (валидация / bounds); 404 band или Konk; 401; 403; 500.

---

### DELETE `/api/sku-stock-bands/:id`

**Ответ 200:** `{ message: string, data: SkuStockBandDto }` удалённого документа

**Ошибки:** 400, 401, 403, 404, 500.

---

Связанные операции по диапазону (discover / batch-correct): [sku-slices](sku-slices.md).
