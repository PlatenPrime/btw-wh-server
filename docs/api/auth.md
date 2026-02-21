# API аутентификации и управления пользователями (Auth)

Модуль аутентификации: вход, регистрация, управление пользователями и ролями. Публичные эндпоинты — login, register. Список пользователей и ролей — ADMIN; создание/обновление пользователей — PRIME; просмотр пользователя по id и /me — USER.

## Эндпоинты

### POST `/api/auth/login`

Вход. Возвращает пользователя (без пароля) и JWT токен.

**Доступ:** без авторизации.

**Запрос body:** `{ username: string, password: string }`.

**Ответ 200:** `{ user: User, token: string }`.

**Ошибки:** 400 (валидация, пользователь не найден, неверный пароль; при валидации — поле `errors`), 500.

---

### POST `/api/auth/register`

Регистрация пользователя.

**Доступ:** без авторизации.

**Запрос body:** `username` (string), `password` (string), `fullname` (string); опционально `role`, `telegram`, `photo`.

**Ответ 201:** `{ user: User }` (без пароля).

**Ошибки:** 400 (валидация), 409 (username уже существует), 500.

---

### GET `/api/auth/users`

Список всех пользователей.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** без тела и query.

**Ответ 200:** массив пользователей (формат зависит от реализации; обычно массив User без паролей).

**Ошибки:** 401, 403, 500.

---

### POST `/api/auth/users`

Создание пользователя.

**Доступ:** checkAuth + checkRoles(PRIME).

**Запрос body:** `username` (string), `password` (string), `fullname` (string); опционально `role`, `telegram`, `photo`.

**Ответ 201:** `{ user: User }` (без пароля).

**Ошибки:** 400 (валидация, поле `errors`), 401, 403, 409 (username уже существует), 500.

---

### GET `/api/auth/users/:id`

Получение пользователя по id.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path-параметр `id` — MongoDB ObjectId.

**Ответ 200:** `{ user: User }`.

**Ошибки:** 400 (невалидный id), 401, 403, 404 (пользователь не найден), 500.

---

### GET `/api/auth/me/:id`

Получение информации о текущем пользователе по id.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path-параметр `id` — MongoDB ObjectId.

**Ответ 200:** объект с пользователем и токеном (формат как у getUpdateUserResponseUtil: `{ user, token }`).

**Ошибки:** 400 (невалидный id), 401, 403, 404, 500.

---

### PUT `/api/auth/users/:userId`

Обновление пользователя (включая username). Передаются только нужные поля.

**Доступ:** checkAuth + checkRoles(PRIME).

**Запрос:** path-параметр `userId` — MongoDB ObjectId. Body: опционально `username`, `password`, `fullname`, `role`, `telegram`, `photo`.

**Ответ 200:** `{ user: User, token: string }` (пользователь без пароля и новый токен).

**Ошибки:** 400 (валидация), 401, 403, 404 (пользователь не найден), 409 (username уже занят), 500.

---

### GET `/api/auth/roles`

Список всех ролей.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** без тела и query.

**Ответ 200:** массив ролей.

**Ошибки:** 401, 403, 500.

## Формат User (в ответах без пароля)

- `_id`: string (MongoDB ObjectId)
- `username`: string
- `fullname`: string
- `role`: string (опционально)
- `telegram`: string (опционально)
- `photo`: string (опционально)
- `createdAt`: Date (ISO строка)
- `updatedAt`: Date (ISO строка)
