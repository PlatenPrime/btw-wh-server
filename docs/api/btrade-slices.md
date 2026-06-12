# API Btrade Slices

Базовый путь: `/api/btrade-slices`.

Концепция модуля: [документация модуля](../modules/btrade-slices.md).

Эндпоинты, HTTP-методы и условия доступа: [Матрица доступа](access-matrix.md) — раздел «/api/btrade-slices».

## Эндпоинты

### GET `/api/btrade-slices`

Срез Btrade по дате: постраничная выдача записей из поля `data` документа среза. Каждая запись сопоставляется с документом **Art** по `artikul` (ключ в `data` среза совпадает с `Art.artikul`). Порядок строк на всех страницах — лексикографическая сортировка по `artikul`.

**Query:**

- `date` (string, YYYY-MM-DD, обязательно)
- `page` (string в query, опционально) — номер страницы, по умолчанию `1`, после разбора целое число > 0
- `limit` (string в query, опционально) — размер страницы, по умолчанию `10`, после разбора целое от 1 до 100 включительно
- `isInvalid` (string в query, опционально) — только `"true"` или `"false"`. При **`isInvalid=true`** в `items` попадают только позиции из `data`, у которых полный `-1` в `quantity` и `price` или цена не является конечным неотрицательным числом (те же правила, что у `GET /api/sku-slices` для `stock`/`price`). Отсутствующие в `data` артикулы из Art не включаются. Если параметр не передан или **`false`**, выдаётся весь `data`.

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
    total: number,       // число ключей в data среза; при isInvalid=true — только число «невалидных» позиций
    totalPages: number,
    hasNext: boolean,
    hasPrev: boolean
  }
}
```

**Ошибки:** 400 (невалидные query, в т.ч. `page`/`limit`), 401, 403, 404 (срез не найден), 500.
