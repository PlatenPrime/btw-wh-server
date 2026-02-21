# API паллет (Pallets)

Модуль управления паллетами. Просмотр списка, пустых паллет, по id, по title, по rowId — USER; создание, обновление, перенос позиций, удаление позиций — ADMIN; удаление паллеты — PRIME.

## Эндпоинты

### GET `/api/pallets`

Список всех паллет.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** без тела.

**Ответ 200:** массив паллет или объект с data.

**Ошибки:** 401, 403, 500.

---

### GET `/api/pallets/empty`

Пустые паллеты.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** без тела.

**Ответ 200:** массив паллет.

**Ошибки:** 401, 403, 500.

---

### GET `/api/pallets/by-row/:rowId`

Паллеты по id ряда.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path `rowId` — MongoDB ObjectId.

**Ответ 200:** массив паллет.

**Ошибки:** 400, 401, 403, 500.

---

### GET `/api/pallets/by-title/:title`

Паллета по названию (title).

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path `title` — строка.

**Ответ 200:** объект паллеты.

**Ошибки:** 400, 401, 403, 404, 500.

---

### GET `/api/pallets/:id`

Паллета по id.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path `id` — MongoDB ObjectId.

**Ответ 200:** объект паллеты.

**Ошибки:** 400, 401, 403, 404, 500.

---

### POST `/api/pallets`

Создание паллеты.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос body:** поля по схеме createPallet.

**Ответ 201:** созданная паллета.

**Ошибки:** 400, 401, 403, 409, 500.

---

### POST `/api/pallets/move-poses`

Перенос позиций между паллетами.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос body:** поля по схеме movePalletPoses (идентификаторы паллет и позиций).

**Ответ 200:** результат операции.

**Ошибки:** 400, 401, 403, 404, 500.

---

### PUT `/api/pallets/:id`

Обновление паллеты.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path `id` — MongoDB ObjectId; body — поля для обновления.

**Ответ 200:** обновлённая паллета.

**Ошибки:** 400, 401, 403, 404, 500.

---

### DELETE `/api/pallets/:id`

Удаление паллеты.

**Доступ:** checkAuth + checkRoles(PRIME).

**Запрос:** path `id` — MongoDB ObjectId.

**Ответ 200:** сообщение об удалении.

**Ошибки:** 400, 401, 403, 404, 500.

---

### DELETE `/api/pallets/:id/poses`

Удаление позиций паллеты.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path `id` — MongoDB ObjectId.

**Ответ 200:** сообщение или результат.

**Ошибки:** 400, 401, 403, 404, 500.

---

### DELETE `/api/pallets/:id/empty-poses`

Удаление пустых позиций паллеты.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path `id` — MongoDB ObjectId.

**Ответ 200:** сообщение или результат.

**Ошибки:** 400, 401, 403, 404, 500.
