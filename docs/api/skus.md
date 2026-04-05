# API SKU конкурентов (Skus)

Эндпоинты для работы с товарами конкурентов (SKU). Чтение доступно роли USER, создание и обновление — ADMIN, удаление — PRIME.

## Эндпоинты

### GET `/api/skus`

Получение списка SKU с пагинацией и фильтрами по конкуренту и производителю.

**Доступ:** checkAuth + checkRoles(USER).

**Query параметры:**

- `page?: number` — номер страницы, по умолчанию `1`
- `limit?: number` — размер страницы, по умолчанию `10`, максимум `100`
- `konkName?: string` — фильтр по имени-ключу конкурента
- `prodName?: string` — фильтр по имени-ключу производителя
- `search?: string` — регистронезависимый поиск по подстроке в `title` (спецсимволы regex экранируются)
- `isInvalid?: string` — только `"true"` или `"false"`; фильтр по полю `Sku.isInvalid`
- `createdFrom?: string` — дата `YYYY-MM-DD`; в выборку попадают SKU с `createdAt` **не раньше** календарного ключа среза для этой даты (`toSliceDate`, часовой пояс как у срезов)

**Ответ 200:**  
`{ message: string, data: Array<Sku>, pagination: { page, limit, total, totalPages, hasNext, hasPrev } }`.

**Ошибки:** 400 (невалидные query-параметры), 401, 403, 500.

---

### GET `/api/skus/by-skugr/:skugrId`

Получение SKU, входящих в указанную товарную группу (`skugr`): выборка по `_id` из массива `skugr.skus`, с теми же фильтрами и пагинацией, что у `GET /api/skus`.

**Доступ:** checkAuth + checkRoles(USER).

**Параметры пути:**

- `skugrId` — MongoDB ObjectId группы (`Skugr`).

**Query параметры:** те же, что у `GET /api/skus`:

- `page`, `limit`, `konkName`, `prodName`, `search`, `isInvalid`, `createdFrom` — те же смыслы, что у `GET /api/skus`.

**Ответ 200:**  
`{ message: string, data: Array<Sku>, pagination: { page, limit, total, totalPages, hasNext, hasPrev } }`.  
Если у группы пустой массив `skus`, `data` — пустой массив, `total` — `0`.

**Ошибки:** 400 (невалидный `skugrId` или query), 401, 403, 404 (группа не найдена), 500.

---

### GET `/api/skus/id/:id`

Получение SKU по id.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path-параметр `id` — MongoDB ObjectId.

**Ответ 200:** `{ message: string, data: Sku }`.

**Ошибки:** 400 (невалидный id), 401, 403, 404 (sku не найден), 500.

---

### GET `/api/skus/konk/:konkName/new-since-excel`

Excel-файл со списком SKU данного конкурента (`konkName` в пути — ключ конкурента), у которых `createdAt` не раньше даты `since`.

**Доступ:** checkAuth + checkRoles(USER).

**Параметры пути:** `konkName` — непустая строка.

**Query:** `since` — обязательно, строка `YYYY-MM-DD`.

**Ответ 200:** бинарный поток `.xlsx`, заголовки `Content-Type` и `Content-Disposition` как у Excel в `sku-slices`.

**Ошибки:** 400 (валидация), 401, 403, 500.

---

### GET `/api/skus/konk/:konkName/invalid-excel`

Excel-файл со списком SKU конкурента с `isInvalid: true`.

**Доступ:** checkAuth + checkRoles(USER).

**Параметры пути:** `konkName`.

**Ответ 200:** `.xlsx` (может быть пустой таблица заголовков, если таких SKU нет).

**Ошибки:** 400, 401, 403, 500.

---

### DELETE `/api/skus/konk/:konkName/invalid`

Удаление **всех** SKU данного конкурента с `isInvalid: true`.

**Доступ:** checkAuth + checkRoles(PRIME).

**Параметры пути:** `konkName`.

**Ответ 200:** `{ message: string, deletedCount: number }`.

**Ошибки:** 400, 401, 403, 500.

---

### POST `/api/skus`

Создание SKU.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос body:**

- `konkName`: string (обязательно)
- `prodName`: string (обязательно)
- `productId`: string (обязательно), канонический идентификатор вида `{konkLower}-{rawId}` (например `air-12345`), уникальный в коллекции
- `btradeAnalog`: string (опционально, по умолчанию `""`)
- `title`: string (обязательно)
- `url`: string (обязательно, валидный URL, уникальный)
- `imageUrl`: string (опционально, по умолчанию `""`)

**Ответ 201:** `{ message: string, data: Sku }`.

**Ошибки:** 400 (валидация, при наличии — поле `errors`), 401, 403, 500.

---

### PATCH `/api/skus/id/:id`

Изменение SKU по id. В body передаются только поля, которые нужно обновить.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path-параметр `id` — MongoDB ObjectId.  
Body: `{ konkName?: string, prodName?: string, productId?: string, btradeAnalog?: string, title?: string, url?: string, imageUrl?: string }` (при передаче `productId` — тот же формат, что при создании).

**Ответ 200:** `{ message: string, data: Sku }`.

**Ошибки:** 400 (валидация), 401, 403, 404, 500.

---

### DELETE `/api/skus/id/:id`

Удаление SKU по id.

**Доступ:** checkAuth + checkRoles(PRIME).

**Запрос:** path-параметр `id` — MongoDB ObjectId.

**Ответ 200:** `{ message: string }`.

**Ошибки:** 400 (невалидный id), 401, 403, 404 (sku не найден), 500.

## Формат Sku

- `_id`: string (MongoDB ObjectId)
- `konkName`: string
- `prodName`: string
- `productId`: string
- `btradeAnalog`: string
- `title`: string
- `url`: string
- `imageUrl`: string
- `isInvalid`: boolean — выставляется еженедельным кроном по правилам срезов (см. модуль Skus)
- `createdAt`: Date (ISO строка)
- `updatedAt`: Date (ISO строка)
