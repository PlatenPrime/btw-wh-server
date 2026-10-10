# API Btrade Slices

Базовый путь: `/api/btrade-slices`.

Концепция модуля: [документация модуля](../modules/btrade-slices.md).

Эндпоинты, HTTP-методы и условия доступа: [Матрица доступа](access-matrix.md) — раздел «/api/btrade-slices».

## Эндпоинты

### GET `/api/btrade-slices`

Срез Btrade по дате: постраничная выдача точек из `btrade_slice_months` за день. Каждая запись сопоставляется с документом **Art** по `artikul`. Порядок строк на всех страницах — лексикографическая сортировка по `artikul`.

**Query:**

- `date` (string, YYYY-MM-DD, обязательно)
- `page` (string в query, опционально) — номер страницы, по умолчанию `1`, после разбора целое число > 0
- `limit` (string в query, опционально) — размер страницы, по умолчанию `10`, после разбора целое от 1 до 100 включительно
- `isInvalid` (string в query, опционально) — только `"true"` или `"false"`. При **`isInvalid=true`** в `items` попадают только invalid точки дня (`quantity`/`price` по тем же правилам sentinel `-1`, что у SKU stock/price). Если параметр не передан или **`false`**, выдаются все точки дня (включая sentinel missing).

**Ответ 200:**

```text
{
  message: string,
  data: {
    date: Date (ISO в JSON),
    items: Array<{
      artikul: string,
      quantity: number,
      price: number,
      art: Art | null   // lean-документ из коллекции arts или null, если Art с таким artikul нет
    }>
  },
  pagination: {
    page: number,
    limit: number,
    total: number,       // число точек дня в months; при isInvalid=true — только число «невалидных» позиций
    totalPages: number,
    hasNext: boolean,
    hasPrev: boolean
  }
}
```

**Ошибки:** 400 (невалидные query, в т.ч. `page`/`limit`), 401, 403, 404 (срез не найден), 500.

---

### GET `/api/btrade-slices/artikul/:artikul/range`

Сырой срез Btrade по одному артикулу за период (без coalesce и расчёта продаж).

**Path:** `artikul` — строка артикула из каталога `Art`.

**Query:** `dateFrom`, `dateTo` (YYYY-MM-DD), `dateFrom` ≤ `dateTo`.

**Ответ 200:** `{ message: string, data: Array<{ date: string, quantity: number, price: number }> }`. В массив попадают только даты, по которым есть точка артикула в `btrade_slice_months`.

**Ошибки:** 400, 401, 403, 404 (артикул не найден в `Art`), 500.
