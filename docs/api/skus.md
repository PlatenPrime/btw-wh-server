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

**Ответ 200:**  
`{ message: string, data: Array<Sku>, pagination: { page, limit, total, totalPages, hasNext, hasPrev } }`.

**Ошибки:** 400 (невалидные query-параметры), 401, 403, 500.

---

### GET `/api/skus/id/:id`

Получение SKU по id.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path-параметр `id` — MongoDB ObjectId.

**Ответ 200:** `{ message: string, data: Sku }`.

**Ошибки:** 400 (невалидный id), 401, 403, 404 (sku не найден), 500.

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
- `createdAt`: Date (ISO строка)
- `updatedAt`: Date (ISO строка)
