# API производителей (Prods)

Эндпоинты для работы с производителями. Список и получение по id/name доступны роли USER; создание и обновление — ADMIN; удаление — только PRIME.

## Эндпоинты

### GET `/api/prods`

Получение списка всех производителей (сортировка по дате создания, сначала новые).

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** без тела; query-параметры не используются.

**Ответ 200:** `{ message: string, data: Array<Prod> }`.

**Ошибки:** 401, 500.

---

### GET `/api/prods/id/:id`

Получение производителя по id.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path-параметр `id` — MongoDB ObjectId.

**Ответ 200:** `{ message: string, data: Prod }`.

**Ошибки:** 400 (невалидный id), 401, 403, 404 (производитель не найден), 500.

---

### GET `/api/prods/name/:name`

Получение производителя по ключу name.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path-параметр `name` — строка.

**Ответ 200:** `{ message: string, data: Prod }`.

**Ошибки:** 400 (пустой name), 401, 403, 404 (производитель не найден), 500.

---

### POST `/api/prods`

Создание производителя.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос body:**

- `name`: string (обязательно)
- `title`: string (обязательно)
- `imageUrl`: string (обязательно)

**Ответ 201:** `{ message: string, data: Prod }`.

**Ошибки:** 400 (валидация, при наличии — поле `errors`), 401, 403, 500.

---

### PATCH `/api/prods/id/:id`

Изменение производителя по id. В body передаются только поля, которые нужно обновить.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path-параметр `id` — MongoDB ObjectId. Body: `{ name?: string, title?: string, imageUrl?: string }`.

**Ответ 200:** `{ message: string, data: Prod }`.

**Ошибки:** 400 (валидация), 401, 403, 404, 500.

---

### DELETE `/api/prods/id/:id`

Удаление производителя по id.

**Доступ:** checkAuth + checkRoles(PRIME).

**Запрос:** path-параметр `id` — MongoDB ObjectId.

**Ответ 200:** `{ message: string }`.

**Ошибки:** 400 (невалидный id), 401, 403, 404 (производитель не найден), 500.

## Формат Prod

Во всех ответах, где возвращается документ производителя:

- `_id`: string (MongoDB ObjectId)
- `name`: string
- `title`: string
- `imageUrl`: string
- `createdAt`: Date (ISO строка в JSON)
- `updatedAt`: Date (ISO строка в JSON)
