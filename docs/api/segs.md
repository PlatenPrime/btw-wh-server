# API сегментов (Segs)

Модуль управления сегментами. Все эндпоинты требуют checkAuth + checkRoles(ADMIN).

## Эндпоинты

### POST `/api/segs`

Создание сегмента.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос body:** поля по схеме createSeg (связь с блоком, название и др.).

**Ответ 201:** созданный сегмент.

**Ошибки:** 400 (валидация), 401, 403, 409, 500.

---

### POST `/api/segs/upsert`

Массовый upsert сегментов.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос body:** массив сегментов по схеме upsert.

**Ответ 200:** результат upsert.

**Ошибки:** 400, 401, 403, 500.

---

### GET `/api/segs`

Список всех сегментов.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** без тела.

**Ответ 200:** массив сегментов или объект с data.

**Ошибки:** 401, 403, 500.

---

### GET `/api/segs/by-block/:blockId`

Сегменты по id блока.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path `blockId` — MongoDB ObjectId.

**Ответ 200:** массив сегментов.

**Ошибки:** 400, 401, 403, 500.

---

### GET `/api/segs/:segId/zones`

Зоны по id сегмента.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path `segId` — MongoDB ObjectId.

**Ответ 200:** массив зон.

**Ошибки:** 400, 401, 403, 404, 500.

---

### GET `/api/segs/:id`

Сегмент по id.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path `id` — MongoDB ObjectId.

**Ответ 200:** объект сегмента.

**Ошибки:** 400, 401, 403, 404, 500.

---

### PUT `/api/segs/:id`

Обновление сегмента.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path `id` — MongoDB ObjectId; body — поля для обновления.

**Ответ 200:** обновлённый сегмент.

**Ошибки:** 400, 401, 403, 404, 500.

---

### DELETE `/api/segs/:id`

Удаление сегмента.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path `id` — MongoDB ObjectId.

**Ответ 200:** сообщение об удалении.

**Ошибки:** 400, 401, 403, 404, 500.
