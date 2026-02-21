# API блоков (Blocks)

Модуль управления блоками. Все операции с блоками — ADMIN, кроме удаления и массового upsert (PRIME). Пересчёт и сброс секторов зон — ADMIN.

## Эндпоинты

### POST `/api/blocks`

Создание блока.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос body:** поля по схеме createBlock (название и др., см. контроллер).

**Ответ 201:** созданный блок (message/data).

**Ошибки:** 400 (валидация), 401, 403, 409 (конфликт), 500.

---

### GET `/api/blocks`

Список всех блоков.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** без тела.

**Ответ 200:** массив блоков или объект с data.

**Ошибки:** 401, 403, 500.

---

### GET `/api/blocks/:id`

Блок по id.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path `id` — MongoDB ObjectId.

**Ответ 200:** объект блока (message/data).

**Ошибки:** 400, 401, 403, 404, 500.

---

### PUT `/api/blocks/:id`

Обновление блока.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path `id` — MongoDB ObjectId; body — поля для обновления.

**Ответ 200:** обновлённый блок.

**Ошибки:** 400, 401, 403, 404, 409, 500.

---

### PATCH `/api/blocks/:id/rename`

Переименование блока.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path `id` — MongoDB ObjectId; body — поле нового имени (по схеме renameBlock).

**Ответ 200:** обновлённый блок.

**Ошибки:** 400, 401, 403, 404, 500.

---

### POST `/api/blocks/upsert`

Массовый upsert блоков.

**Доступ:** checkAuth + checkRoles(PRIME).

**Запрос body:** массив блоков по схеме upsert.

**Ответ 200:** результат upsert (message/result).

**Ошибки:** 400, 401, 403, 500.

---

### DELETE `/api/blocks/:id`

Удаление блока.

**Доступ:** checkAuth + checkRoles(PRIME).

**Запрос:** path `id` — MongoDB ObjectId.

**Ответ 200:** сообщение об удалении.

**Ошибки:** 400, 401, 403, 404, 500.

---

### POST `/api/blocks/reset-zones-sectors`

Сброс секторов всех зон (разовая операция).

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** без тела.

**Ответ 200:** сообщение или результат.

**Ошибки:** 401, 403, 500.

---

### POST `/api/blocks/recalculate-zones-sectors`

Пересчёт секторов зон по позициям блоков и зон.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** без тела.

**Ответ 200:** сообщение или результат.

**Ошибки:** 401, 403, 500.
