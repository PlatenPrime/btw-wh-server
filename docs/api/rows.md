# API рядов (Rows)

Модуль управления рядами. Просмотр списка, по id и по title — USER; создание и обновление — ADMIN; удаление — PRIME.

## Эндпоинты

### GET `/api/rows`

Список всех рядов.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** без тела.

**Ответ 200:** массив рядов или объект с data.

**Ошибки:** 401, 403, 500.

---

### GET `/api/rows/id/:id`

Ряд по id.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path `id` — MongoDB ObjectId.

**Ответ 200:** объект ряда.

**Ошибки:** 400, 401, 403, 404, 500.

---

### GET `/api/rows/title/:title`

Ряд по названию (title).

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path `title` — строка.

**Ответ 200:** объект ряда.

**Ошибки:** 400, 401, 403, 404, 500.

---

### POST `/api/rows`

Создание ряда.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос body:** поля по схеме createRow (title и др.).

**Ответ 201:** созданный ряд.

**Ошибки:** 400 (валидация), 401, 403, 409, 500.

---

### PUT `/api/rows/:id`

Обновление ряда.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path `id` — MongoDB ObjectId; body — поля для обновления.

**Ответ 200:** обновлённый ряд.

**Ошибки:** 400, 401, 403, 404, 500.

---

### DELETE `/api/rows/:id`

Удаление ряда.

**Доступ:** checkAuth + checkRoles(PRIME).

**Запрос:** path `id` — MongoDB ObjectId.

**Ответ 200:** сообщение об удалении.

**Ошибки:** 400, 401, 403, 404, 500.
