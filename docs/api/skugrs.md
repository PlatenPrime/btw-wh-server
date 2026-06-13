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

Заполнение массива `skus` группы по данным парсера страниц группы в модуле `browser`. Для `konkName` выбирается реализация: `yumi`, `yumin`, `air`, `sharte`, `balun`, `perfect`; для неподдерживаемого конкурента — **400**.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Параметры пути:** `id` — ObjectId группы.

**Body (JSON, опционально):**

- `maxPages?: number` — лимит страниц пагинации для парсера (1–200), для конкурентов с постраничным обходом листинга (в т.ч. Yumi, Balun, Perfect и др.).

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
    "skippedNoProductId": 0,
    "skippedProductIdConflict": 0,
    "skippedNonNewskuManufacturer": 0,
    "promotedFromNewsku": 0,
    "linkedExisting": 0,
    "created": 0
  }
}
```

Поле `stats`: сколько позиций вернул парсер (`fetched`); сколько отброшено из‑за дубликата `url` в выдаче (`dedupedByUrl`); сколько URL уже были в группе (`skippedAlreadyInGroup`); без идентификатора товара в выдаче (`skippedNoProductId`); конфликт по занятому другим URL `productId` (`skippedProductIdConflict`); для группы с производителем-заглушкой `newsku` — сколько существующих по URL SKU не добавлено, потому что у них уже другой `prodName` (`skippedNonNewskuManufacturer`); для группы с любым другим `prodName` — сколько существующих по URL SKU имели `prodName: "newsku"` и получили обновление на `prodName` текущей группы (`promotedFromNewsku`); сколько существующих SKU только добавлено в группу (`linkedExisting`); сколько создано новых документов SKU (`created`). У **новых** SKU при создании заполняются `title`, `url` и `imageUrl` из ответа парсера. У уже существующих SKU поля обычно не меняются, кроме случая промоута с `newsku` на `prodName` парсируемой группы (см. модуль Skugrs).

**Ошибки:** 400 (валидация или неподдерживаемый `konkName`), 404 (группа не найдена), 401, 403, 500.

---

### POST `/api/skugrs/id/:id/clear-skus`

Обнуление массива `skus` у группы. Документы `Sku` в коллекции не удаляются.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Параметры пути:** `id` — ObjectId группы.

**Ответ 200:** `{ message: string, data: Skugr }` — полный DTO группы после обновления (в т.ч. пустой массив `skus`).

**Ошибки:** 400 (невалидный id), 401, 403, 404 (группа не найдена), 500.

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

### DELETE `/api/skugrs/id/:id/with-skus`

Удаление группы по id вместе с документами `Sku`, чьи `_id` перечислены в `skugr.skus`. У остальных товарных групп те же `_id` удаляются из массива `skus` (`$pullAll`), чтобы не оставалось ссылок на уже удалённые SKU.

**Доступ:** checkAuth + checkRoles(PRIME).

**Параметры пути:** `id` — ObjectId группы.

**Ответ 200:** `{ message: string, data: { deletedSkusCount: number, modifiedSkugrsCount: number } }` — сколько документов `Sku` удалено и сколько **других** групп было изменено при очистке пересечений по `skus`.

**Ошибки:** 400 (невалидный id), 401, 403, 404 (группа не найдена), 500.

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

Используется в ответах `GET /api/skugrs` (каждый элемент массива), `POST /api/skugrs`, `PATCH /api/skugrs/id/:id`, `POST /api/skugrs/id/:id/fill-skus`, `POST /api/skugrs/id/:id/clear-skus` (поле `data`).

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

Дневные агрегаты и Excel по остаткам/продажам для списка SKU группы (`skugr.skus`) — модули **sku-sales-reports** и **sku-excel-reports** (роль ADMIN): см. [sku-sales-reports](sku-sales-reports.md), [sku-excel-reports](sku-excel-reports.md) и [миграцию](sku-api-migration.md).
