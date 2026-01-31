# API админки пользователей (для фронтенда)

Эндпоинты для управления пользователями в админ-панели. Чтение списка и отдельного пользователя доступно роли ADMIN и выше; создание и полное редактирование (включая логин) — только роли PRIME.

## Эндпоинты

### GET `/api/auth/users`

Получение списка всех пользователей.

**Доступ:** роль ADMIN или выше (checkAuth + checkRoles).

**Запрос:** без тела; query-параметры не используются.

**Ответ 200:** массив объектов User без поля password. Каждый элемент: `_id`, `username`, `fullname`, `role?`, `telegram?`, `photo?`, `createdAt`, `updatedAt`.

**Ошибки:** 401 (не авторизован), 403 (недостаточно прав), 500.

---

### GET `/api/auth/users/:id`

Получение пользователя по идентификатору.

**Доступ:** любой авторизованный пользователь (checkAuth + checkRoles USER).

**Запрос:** path-параметр `id` — MongoDB ObjectId.

**Ответ 200:** `{ user: User без password }`.

**Ошибки:** 400 (невалидный id), 401, 403, 404 (пользователь не найден), 500.

---

### POST `/api/auth/users`

Создание пользователя.

**Доступ:** только роль PRIME (checkAuth + checkRoles PRIME).

**Запрос body:**
- `username`: string (обязательно)
- `password`: string (обязательно)
- `fullname`: string (обязательно)
- `role`: string (опционально)
- `telegram`: string (опционально)
- `photo`: string (опционально)

**Ответ 201:** `{ user: User без password }`.

**Ошибки:** 400 (валидация, поле `errors` при наличии), 401, 403, 409 (username уже существует), 500.

---

### PUT `/api/auth/users/:userId`

Обновление пользователя (все поля, включая username).

**Доступ:** только роль PRIME (checkAuth + checkRoles PRIME).

**Запрос:** path-параметр `userId` — MongoDB ObjectId. Body — все поля опциональны:
- `username`: string
- `password`: string
- `fullname`: string
- `role`: string
- `telegram`: string
- `photo`: string

**Ответ 200:** `{ user: User без password, token: string }`.

**Ошибки:** 400 (валидация), 401, 403, 404 (пользователь не найден), 409 (username уже занят другим пользователем), 500.

## Формат User (без password)

Во всех ответах пользователь представлен объектом с полями: `_id`, `username`, `fullname`, `role?`, `telegram?`, `photo?`, `createdAt`, `updatedAt`. Поле `password` не возвращается.
