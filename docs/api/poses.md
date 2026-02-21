# API позиций (Poses)

Модуль управления позициями. Просмотр списка, по id, по артикулу, по паллете, по ряду — USER; создание (в т.ч. bulk), обновление, удаление, заполнение недостающих данных, экспорт — ADMIN.

## Эндпоинты

### GET `/api/poses`

Список всех позиций.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** без тела.

**Ответ 200:** массив позиций или объект с data.

**Ошибки:** 401, 403, 500.

---

### GET `/api/poses/:id`

Позиция по id.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path `id` — MongoDB ObjectId.

**Ответ 200:** объект позиции.

**Ошибки:** 400, 401, 403, 404, 500.

---

### GET `/api/poses/by-artikul/:artikul`

Позиции по артикулу.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path `artikul` — строка.

**Ответ 200:** массив позиций.

**Ошибки:** 400, 401, 403, 500.

---

### GET `/api/poses/by-pallet/:palletId`

Позиции по id паллеты.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path `palletId` — MongoDB ObjectId.

**Ответ 200:** массив позиций.

**Ошибки:** 400, 401, 403, 500.

---

### GET `/api/poses/by-row/:rowId`

Позиции по id ряда.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path `rowId` — MongoDB ObjectId.

**Ответ 200:** массив позиций.

**Ошибки:** 400, 401, 403, 500.

---

### POST `/api/poses`

Создание позиции.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос body:** поля по схеме createPos.

**Ответ 201:** созданная позиция.

**Ошибки:** 400, 401, 403, 409, 500.

---

### POST `/api/poses/bulk`

Массовое создание позиций.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос body:** массив позиций по схеме bulkCreatePoses.

**Ответ 201:** результат создания (массив или message/result).

**Ошибки:** 400, 401, 403, 500.

---

### POST `/api/poses/populate-missing-data`

Заполнение недостающих данных в позициях.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** без тела или по схеме контроллера.

**Ответ 200:** сообщение или результат.

**Ошибки:** 401, 403, 500.

---

### POST `/api/poses/export-stocks`

Экспорт позиций/запасов в Excel.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** без тела.

**Ответ 200:** бинарное тело (файл Excel).

**Ошибки:** 401, 403, 500.

---

### PUT `/api/poses/:id`

Обновление позиции.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path `id` — MongoDB ObjectId; body — поля для обновления.

**Ответ 200:** обновлённая позиция.

**Ошибки:** 400, 401, 403, 404, 500.

---

### DELETE `/api/poses/:id`

Удаление позиции.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path `id` — MongoDB ObjectId.

**Ответ 200:** сообщение об удалении.

**Ошибки:** 400, 401, 403, 404, 500.
