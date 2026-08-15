# API GraboSku

Базовый путь: `/api/grabo-skus`

Роль: минимум **ADMIN**. JWT обязателен.

Документ в JSON — поля модели включая `_id`, `tags`, `isNewProduct`, timestamps. `__v` не отдаётся.

## GET `/`

Список карточек с пагинацией и фильтрами. Сортировка: `productId` по возрастанию.

### Query

Все параметры optional.

- `page` — номер страницы, по умолчанию `1`, целое > 0
- `limit` — размер страницы, по умолчанию `10`, от 1 до 100
- `search` — регистронезависимый regex по `title` **или** `productId`; спецсимволы экранируются; пустая строка после trim игнорируется
- `productId` — точное совпадение после trim
- `isOnSite`, `isNewProduct` — только `"true"` или `"false"`
- `color`, `material`, `gas`, `language` — точное совпадение после trim
- `size` — значение опции селекта (префикс сырого поля до первого `/`, например `40"` для документа `40" / 62x91x25 cm`), не полная строка из Mongo
- `tag` — документ, у которого массив `tags` содержит значение
- `includeFilterOptions` — `"true"` или `"false"`, по умолчанию false. При `"true"` в ответ добавляется `filterOptions`

Несколько фильтров комбинируются через AND.

### Responses

**200**

```
{
  message: string,
  data: Array<GraboSku>,
  pagination: { page, limit, total, totalPages, hasNext, hasPrev },
  filterOptions?: {
    color: string[],
    size: string[],
    material: string[],
    gas: string[],
    language: string[]
  }
}
```

`filterOptions` есть только при `includeFilterOptions=true`. Значения — все уникальные непустые из всей коллекции, не из текущей страницы и не сужаются текущими фильтрами. Для `size` опция — префикс до `/`; несколько сырых строк с одним префиксом дают одну опцию. Пустые строки в опции не входят. Массивы отсортированы.

**400** — невалидные query-параметры

**401 / 403** — как у `/sync`

**500** — ошибка сервера

## GET `/id/:id`

Карточка по MongoDB ObjectId.

**Ответ 200:** `{ message: string, data: GraboSku }`

**400** — невалидный id

**401 / 403** — как у `/sync`

**404** — документа нет

**500** — ошибка сервера

## POST `/sync`

Ручной полный срез каталога Grabo. Захватывает in-memory lock и сразу возвращает 202; работа идёт в фоне. По завершении — analytics-отчёт.

### Request

Тело не требуется.

### Responses

**202** — принято

```
{
  message: string,
  data: { accepted: true }
}
```

**401** — нет/невалидный JWT

**403** — роль ниже ADMIN

**409** — срез уже выполняется на этом инстансе

```
{
  message: "Grabo SKU sync already running"
}
```

## GET `/excel`

XLSX всех документов `GraboSku`, сортировка по `productId`.

Заголовки колонок — camelCase имена полей модели без `_id` и `__v`:

`productId`, `title`, `url`, `isNewProduct`, `color`, `size`, `material`, `gas`, `language`, `gasCapacity`, `tags`, `images`, `isOnSite`, `lastSeenAt`, `createdAt`, `updatedAt`

`tags` и `images` — строки, элементы через `"; "`. Даты — ISO-8601. Boolean — `true`/`false`.

**Ответ 200:** бинарный `.xlsx`, `Content-Disposition: attachment; filename="graboskus.xlsx"`.

**401 / 403** — как у `/sync`.
