# API конкурентов (Konks)

Эндпоинты для работы с конкурентами. Список и получение по id/name доступны роли USER; создание и обновление — ADMIN; удаление — только PRIME.

## Эндпоинты

### GET `/api/konks`

Получение списка всех конкурентов (сортировка по дате создания, сначала новые).

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** без тела; query-параметры не используются.

**Ответ 200:** `{ message: string, data: Array<Konk> }`.

**Ошибки:** 401, 500.

---

### GET `/api/konks/id/:id`

Получение конкурента по id.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path-параметр `id` — MongoDB ObjectId.

**Ответ 200:** `{ message: string, data: Konk }`.

**Ошибки:** 400 (невалидный id), 401, 403, 404 (конкурент не найден), 500.

---

### GET `/api/konks/name/:name`

Получение конкурента по ключу name.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path-параметр `name` — строка.

**Ответ 200:** `{ message: string, data: Konk }`.

**Ошибки:** 400 (пустой name), 401, 403, 404 (конкурент не найден), 500.

---

### POST `/api/konks`

Создание конкурента.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос body:**

- `name`: string (обязательно, одним словом — без пробелов)
- `title`: string (обязательно)
- `url`: string (обязательно)
- `imageUrl`: string (обязательно)

**Ответ 201:** `{ message: string, data: Konk }`.

**Ошибки:** 400 (валидация, при наличии — поле `errors`), 401, 403, 500.

---

### PATCH `/api/konks/id/:id`

Изменение конкурента по id. В body передаются только поля, которые нужно обновить.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path-параметр `id` — MongoDB ObjectId. Body: `{ name?: string, title?: string, url?: string, imageUrl?: string }` (name — одним словом при передаче).

**Ответ 200:** `{ message: string, data: Konk }`.

**Ошибки:** 400 (валидация), 401, 403, 404, 500.

---

### DELETE `/api/konks/id/:id`

Удаление конкурента по id.

**Доступ:** checkAuth + checkRoles(PRIME).

**Запрос:** path-параметр `id` — MongoDB ObjectId.

**Ответ 200:** `{ message: string }`.

**Ошибки:** 400 (невалидный id), 401, 403, 404 (конкурент не найден), 500.

## Формат Konk

Во всех ответах, где возвращается документ конкурента:

- `_id`: string (MongoDB ObjectId)
- `name`: string
- `title`: string
- `url`: string
- `imageUrl`: string
- `createdAt`: Date (ISO строка в JSON)
- `updatedAt`: Date (ISO строка в JSON)
