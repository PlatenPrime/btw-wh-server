# API групп товаров конкурента (Skugrs)

Эндпоинты для групп SKU конкурента. Чтение — роль USER, создание и обновление — ADMIN, удаление — PRIME.

## Эндпоинты

### GET `/api/skugrs`

Список групп с пагинацией и фильтрами.

**Доступ:** checkAuth + checkRoles(USER).

**Query-параметры:**

- `page?: number` — страница, по умолчанию `1`
- `limit?: number` — размер страницы, по умолчанию `10`, максимум `100`
- `konkName?: string` — точное совпадение с полем группы
- `prodName?: string` — точное совпадение с полем группы
- `search?: string` — регистронезависимый поиск по подстроке в `title` (спецсимволы regex экранируются)
- `isSliced?: boolean` — фильтр по участию товарной группы в срезах (`true`/`false`)

**Ответ 200:**

```json
{
  "message": "Skugrs retrieved successfully",
  "data": [
    /* массив Skugr */
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0,
    "hasNext": false,
    "hasPrev": false
  }
}
```

**Ошибки:** 400 (невалидные query), 401, 403, 500.

---

### GET `/api/skugrs/id/:id`

Одна товарная группа: **метаданные без поля `skus`** — в ответе только `_id`, `konkName`, `prodName`, `title`, `url`, `createdAt`, `updatedAt` (см. раздел «Формат Skugr в `data`» и примечание ниже).

**Доступ:** checkAuth + checkRoles(USER).

**Параметры пути:** `id` — ObjectId группы.

**Ответ 200:** `{ message: "Skugr retrieved successfully", data: { ... } }` — объект без ключа `skus`.

**Ошибки:** 400 (невалидный id), 401, 403, 404 (группа не найдена), 500.

---

### POST `/api/skugrs`

Создание группы.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Body (JSON):**

- `konkName`: string (обязательно)
- `prodName`: string (обязательно)
- `title`: string (обязательно)
- `url`: string (обязательно, валидный URL)
- `skus`: string[] (опционально, по умолчанию `[]`) — массив MongoDB ObjectId существующих SKU

**Ответ 201:** `{ message, data: Skugr }`.

**Ошибки:** 400 (валидация Zod или несуществующие id в `skus`), 401, 403, 500.

---

### POST `/api/skugrs/id/:id/fill-skus`

Заполнение массива `skus` группы по данным парсера страниц группы в модуле `browser`. Для `konkName` выбирается реализация (сейчас: `yumi`); для неподдерживаемого конкурента — **400**.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Параметры пути:** `id` — ObjectId группы.

**Body (JSON, опционально):**

- `maxPages?: number` — лимит страниц пагинации для парсера (1–200), только для конкурентов, где параметр применим (например Yumi).

**Ответ 200:**

```json
{
  "message": "Skugr skus filled from browser successfully",
  "data": {
    /* Skugr DTO после обновления */
  },
  "stats": {
    "fetched": 0,
    "dedupedByUrl": 0,
    "skippedAlreadyInGroup": 0,
    "linkedExisting": 0,
    "created": 0
  }
}
```

Поле `stats`: сколько позиций вернул парсер (`fetched`), сколько отброшено из‑за дубликата `url` в выдаче (`dedupedByUrl`), сколько URL уже были в группе (`skippedAlreadyInGroup`), сколько существующих SKU только добавлено в группу (`linkedExisting`), сколько создано новых документов SKU (`created`). У **новых** SKU при создании заполняются `title`, `url` и `imageUrl` из ответа парсера (у уже существующих SKU поля не меняются).

**Ошибки:** 400 (валидация или неподдерживаемый `konkName`), 404 (группа не найдена), 401, 403, 500.

---

### PATCH `/api/skugrs/id/:id`

Частичное обновление метаданных группы. Поле `skus` этим методом не меняется.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Параметры пути:** `id` — ObjectId группы.

**Body:** любое сочетание полей:

- `konkName?: string`
- `prodName?: string`
- `title?: string`
- `url?: string` (валидный URL)
- `isSliced?: boolean`

Пустой объект допустим: возвращается текущий документ без изменений.

**Ответ 200:** `{ message, data: Skugr }`.

**Ошибки:** 400 (валидация), 401, 403, 404, 500.

---

### DELETE `/api/skugrs/id/:id`

Удаление группы по id. Документы `Sku` не удаляются.

**Доступ:** checkAuth + checkRoles(PRIME).

**Ответ 200:** `{ message: "Skugr deleted successfully" }`.

**Ошибки:** 400 (невалидный id), 401, 403, 404, 500.

---

### POST `/api/skugrs/set-is-sliced`

Единоразово проставляет `isSliced: true` всем текущим группам, у которых поле ещё отсутствует.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Body:** не требуется.

**Ответ 200:**

```json
{
  "message": "Skugr isSliced field set successfully",
  "data": {
    "matchedCount": 0,
    "modifiedCount": 0
  }
}
```

**Ошибки:** 401, 403, 500.

## Формат Skugr в `data`

Используется в ответах `GET /api/skugrs` (каждый элемент массива), `POST /api/skugrs`, `PATCH /api/skugrs/id/:id`, `POST /api/skugrs/id/:id/fill-skus` (поле `data`).

- `_id`: string (ObjectId)
- `konkName`: string
- `prodName`: string
- `title`: string
- `url`: string
- `isSliced`: boolean
- `skus`: string[] (ObjectId в виде строк)
- `createdAt`, `updatedAt`: даты (ISO-строка в JSON)

**`GET /api/skugrs/id/:id`:** те же поля, что в списке выше, **кроме** `skus` — поле в JSON **отсутствует** (не пустой массив).

## Отчёты и графики по составу группы (`skus`)

Дневные агрегаты и Excel по остаткам/продажам для списка SKU группы (`skugr.skus`) отдаются модулем **sku-slices** (роль USER): см. [API срезов SKU](sku-slices.md) — маршруты `/api/sku-slices/skugr/:skugrId/daily-summary`, `.../slice-excel`, `.../sales-excel` с query `dateFrom` и `dateTo`.
