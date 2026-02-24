# API констант (Constants)

Эндпоинты для работы с пользовательскими константами. Список и получение по id/name доступны роли USER; создание и обновление — ADMIN; удаление — только PRIME.

## Эндпоинты

### GET `/api/constants`

Получение списка всех констант (сортировка по дате создания, сначала новые).

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** без тела; query-параметры не используются.

**Ответ 200:** `{ message: string, data: Array<Constant> }`.

**Ошибки:** 401, 500.

---

### GET `/api/constants/id/:id`

Получение константы по id.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path-параметр `id` — MongoDB ObjectId.

**Ответ 200:** `{ message: string, data: Constant }`.

**Ошибки:** 400 (невалидный id), 401, 403, 404 (константа не найдена), 500.

---

### GET `/api/constants/name/:name`

Получение константы по ключу name.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path-параметр `name` — строка.

**Ответ 200:** `{ message: string, data: Constant }`.

**Ошибки:** 400 (пустой name), 401, 403, 404 (константа не найдена), 500.

---

### POST `/api/constants`

Создание константы.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос body:**

- `name`: string (обязательно, одним словом — без пробелов)
- `title`: string (обязательно)
- `data`: object (опционально) — объект с ключами и значениями в виде строк. По умолчанию `{}`.

**Ответ 201:** `{ message: string, data: Constant }`.

**Ошибки:** 400 (валидация, при наличии — поле `errors`), 401, 403, 500.

---

### PATCH `/api/constants/id/:id`

Изменение константы по id. В body передаются только поля, которые нужно обновить.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path-параметр `id` — MongoDB ObjectId. Body: `{ name?: string, title?: string, data?: Record<string, string> }` (name — одним словом при передаче).

**Ответ 200:** `{ message: string, data: Constant }`.

**Ошибки:** 400 (валидация), 401, 403, 404, 500.

---

### DELETE `/api/constants/id/:id`

Удаление константы по id.

**Доступ:** checkAuth + checkRoles(PRIME).

**Запрос:** path-параметр `id` — MongoDB ObjectId.

**Ответ 200:** `{ message: string }`.

**Ошибки:** 400 (невалидный id), 401, 403, 404 (константа не найдена), 500.

## Формат Constant

Во всех ответах, где возвращается документ константы:

- `_id`: string (MongoDB ObjectId)
- `name`: string — уникальный ключ (одним словом)
- `title`: string — название коллекции значений
- `data`: object — объект с ключами и значениями (строки)
- `createdAt`: Date (ISO строка в JSON)
- `updatedAt`: Date (ISO строка в JSON)
