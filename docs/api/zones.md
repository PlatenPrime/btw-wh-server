# API зон (Zones)

Модуль управления зонами. Просмотр и изменение зон — ADMIN; удаление зоны и массовый upsert — PRIME.

## Эндпоинты

### POST `/api/zones`

Создание зоны.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос body:** поля по схеме createZone.

**Ответ 201:** созданная зона.

**Ошибки:** 400 (валидация), 401, 403, 409, 500.

---

### GET `/api/zones`

Список зон с пагинацией и поиском.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** query — page, limit, search (по схеме getAllZones).

**Ответ 200:** объект с data (массив зон) и пагинацией (total, page, totalPages и т.д.).

**Ошибки:** 400 (невалидные query), 401, 403, 500.

---

### GET `/api/zones/export`

Экспорт зон в Excel.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** без тела.

**Ответ 200:** бинарное тело (файл Excel).

**Ошибки:** 401, 403, 500.

---

### GET `/api/zones/title/:title`

Зона по названию (title).

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path `title` — строка.

**Ответ 200:** объект зоны.

**Ошибки:** 400, 401, 403, 404, 500.

---

### GET `/api/zones/by-block/:blockId`

Зоны по id блока.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path `blockId` — MongoDB ObjectId.

**Ответ 200:** массив зон.

**Ошибки:** 400, 401, 403, 500.

---

### GET `/api/zones/:id`

Зона по id.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path `id` — MongoDB ObjectId.

**Ответ 200:** объект зоны.

**Ошибки:** 400, 401, 403, 404, 500.

---

### PUT `/api/zones/:id`

Обновление зоны.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path `id` — MongoDB ObjectId; body — поля для обновления.

**Ответ 200:** обновлённая зона.

**Ошибки:** 400, 401, 403, 404, 500.

---

### DELETE `/api/zones/:id`

Удаление зоны.

**Доступ:** checkAuth + checkRoles(PRIME).

**Запрос:** path `id` — MongoDB ObjectId.

**Ответ 200:** сообщение об удалении.

**Ошибки:** 400, 401, 403, 404, 500.

---

### POST `/api/zones/upsert`

Массовое создание/обновление зон (upsert).

**Доступ:** checkAuth + checkRoles(PRIME).

**Запрос body:** массив зон по схеме upsert.

**Ответ 200:** результат upsert.

**Ошибки:** 400, 401, 403, 500.
