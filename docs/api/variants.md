# API Variants (Варианты)

## Эндпоинты

### GET `/api/variants`

Получение списка вариантов с пагинацией и фильтрами по `konkName` и `prodName`.
Сортировка по `title`.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** query-параметры:
- `konkName`: string (опционально)
- `prodName`: string (опционально)
- `search`: string (опционально) — поиск по `title` (регистронезависимое совпадение)
- `page`: string (опционально, по умолчанию 1)
- `limit`: string (опционально, 1–100, по умолчанию 10)

**Ответ 200:** `{ message: string, data: Array<Variant>, pagination: { page, limit, total, totalPages, hasNext, hasPrev } }`.

**Ошибки:** 400 (невалидные параметры), 401, 403, 500.

---

### GET `/api/variants/id/:id`

Получение варианта по id.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path-параметр `id` — MongoDB ObjectId.

**Ответ 200:** `{ message: string, data: Variant }`.

**Ошибки:** 400 (невалидный id), 401, 403, 404 (вариант не найден), 500.

---

### POST `/api/variants`

Создание варианта.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос body:**
- `konkName`: string (обязательно)
- `prodName`: string (обязательно)
- `title`: string (обязательно)
- `url`: string (обязательно, уникальный)
- `varGroup`: object (опционально) — `{ id: string, title: string }`
- `imageUrl`: string (обязательно)

**Ответ 201:** `{ message: string, data: Variant }`.

**Ошибки:** 400 (валидация, при наличии — поле `errors`), 401, 403, 409 (url уже существует), 500.

---

### PATCH `/api/variants/id/:id`

Изменение варианта по id. В body передаются только поля, которые нужно обновить.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:**
- path-параметр `id` — MongoDB ObjectId
- body: `{ konkName?: string, prodName?: string, title?: string, url?: string, varGroup?: { id: string, title: string }, imageUrl?: string }`

**Ответ 200:** `{ message: string, data: Variant }`.

**Ошибки:** 400 (валидация, пустой body), 401, 403, 404 (вариант не найден), 500.

---

### DELETE `/api/variants/id/:id`

Удаление варианта по id.

**Доступ:** checkAuth + checkRoles(PRIME).

**Запрос:** path-параметр `id` — MongoDB ObjectId.

**Ответ 200:** `{ message: string }`.

**Ошибки:** 400 (невалидный id), 401, 403, 404 (вариант не найден), 500.

## Формат Variant

- `_id`: string (MongoDB ObjectId)
- `konkName`: string
- `prodName`: string
- `title`: string
- `url`: string
- `varGroup`: object (опционально) — `{ id: string, title: string }`
- `imageUrl`: string
- `createdAt`: Date (ISO строка в JSON)
- `updatedAt`: Date (ISO строка в JSON)

