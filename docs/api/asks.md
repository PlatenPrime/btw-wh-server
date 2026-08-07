# API заявок (Asks)

Модуль управления заявками. Создание и просмотр заявок (по id, по дате, по артикулу), pulls — USER; фиксация снятия (pull), завершение, отклонение, обновление действий — ADMIN; удаление — ADMIN/PRIME или владелец заявки (checkOwnership).

## Эндпоинты

### POST `/api/asks`

Создание заявки.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос body:** `artikul` (string, обязательно), `askerId` (MongoDB ObjectId, обязательно); опционально `nameukr`, `quant` (number), `com`, `sklad` ("pogrebi" | "merezhi"), `zone`.

**Ответ 201:** объект с созданной заявкой (формат из контроллера).

**Ошибки:** 400 (валидация, поле `errors`), 401, 403, 500.

---

### GET `/api/asks/by-date`

Заявки по дате.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** query `date` — строка даты (валидный ISO/дата).

**Ответ 200:** объект с данными заявок (массив или message/data).

**Ошибки:** 400 (невалидная дата), 401, 403, 500.

---

### GET `/api/asks/by-artikul`

Заявки по артикулу.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** query `artikul` — строка (обязательно).

**Ответ 200:** объект с данными заявок.

**Ошибки:** 400, 401, 403, 500.

---

### GET `/api/asks/pulls`

Все позиции для снятия по активным заявкам.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** без тела.

**Ответ 200:** `{ message: string, data: { positionsBySector: Array<{ sector: number, positions: Array<PositionForPull> }> } }`

Поля позиции (релевантные для UI): `quant` (остаток на паллете), `plannedQuant` (сколько снять), `artZone` (зона артикула из Arts, `null` если Art нет), `askId`, `askArtikul`, `askQuant`, `askRemainingQuantity`, плюс остальные поля Pos.

**Ошибки:** 401, 403, 500.

---

### GET `/api/asks/:id/pull`

Позиции для снятия по id заявки.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path `id` — MongoDB ObjectId.

**Ответ 200:** `{ message: string, data: { isPullRequired: boolean, positions: Array<PositionForPull>, remainingQuantity: number | null, status: "process" | "satisfied" | "no_poses" | "finished", message: string } }`

Позиции содержат те же поля, что и в `/pulls`, включая `artZone`, `quant`, `plannedQuant`.

**Ошибки:** 400, 401, 403, 404, 500.

---

### GET `/api/asks/:id`

Заявка по id.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path `id` — MongoDB ObjectId.

**Ответ 200:** при найденном — `{ exists: true, message: string, data: Ask }`; при ненайденном — `{ exists: false, message: string, data: null }`.

**Ошибки:** 400 (невалидный id), 401, 403, 500.

---

### PATCH `/api/asks/:id/pull`

Зафиксировать снятие товара (pull).

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path `id` — MongoDB ObjectId.

**Ответ 200:** обновлённая заявка или message/data.

**Ошибки:** 400, 401, 403, 404, 500.

---

### PATCH `/api/asks/:id/complete`

Завершить заявку.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path `id` — MongoDB ObjectId.

**Ответ 200:** обновлённая заявка или message/data.

**Ошибки:** 400, 401, 403, 404, 500.

---

### PATCH `/api/asks/:id/reject`

Отклонить заявку.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path `id` — MongoDB ObjectId.

**Ответ 200:** обновлённая заявка или message/data.

**Ошибки:** 400, 401, 403, 404, 500.

---

### PATCH `/api/asks/:id/actions`

Обновить действия заявки.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path `id` — MongoDB ObjectId. Body: `action` (string), `userId` (MongoDB ObjectId).

**Ответ 200:** обновлённая заявка или message/data.

**Ошибки:** 400 (валидация), 401, 403, 404, 500.

---

### DELETE `/api/asks/:id`

Удаление заявки.

**Доступ:** checkAuth + checkOwnership (владелец заявки) или роли, допускающие удаление.

**Запрос:** path `id` — MongoDB ObjectId.

**Ответ 200:** сообщение об успешном удалении.

**Ошибки:** 400, 401, 403, 404, 500.
