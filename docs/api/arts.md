# API артикулов (Arts)

Модуль управления артикулами. Просмотр списка, по id, по артикулу, по зоне, информация Btrade — USER; обновление лимита, upsert, btrade-stock, экспорт — ADMIN; удаление артикулов без последнего маркера — PRIME.

## Эндпоинты

### GET `/api/arts`

Список артикулов с пагинацией и поиском.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** query — `page` (number, по умолчанию 1), `limit` (1–100, по умолчанию 10), `search` (string, опционально).

**Ответ 200:** `{ data: Array<Art>, total: number, page: number, totalPages: number }`.

**Ошибки:** 400 (невалидные query), 401, 403, 500.

---

### GET `/api/arts/zone/:zone`

Артикулы по зоне.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path `zone` — строка.

**Ответ 200:** `{ message: string, data: Array<Art> }` или аналог.

**Ошибки:** 400, 401, 403, 500.

---

### GET `/api/arts/id/:id`

Артикул по id.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path `id` — MongoDB ObjectId.

**Ответ 200:** при найденном — `{ exists: true, message: string, data: Art }`; при ненайденном — `{ exists: false, message: string, data: null }`.

**Ошибки:** 400 (невалидный id), 401, 403, 500.

---

### GET `/api/arts/artikul/:artikul`

Артикул по номеру артикула.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path `artikul` — строка.

**Ответ 200:** объект с полями exists, message, data (Art или null).

**Ошибки:** 400, 401, 403, 500.

---

### GET `/api/arts/btrade/:artikul`

Информация по артикулу из Btrade.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path `artikul` — строка.

**Ответ 200:** объект с данными Btrade (структура зависит от контроллера).

**Ошибки:** 400, 401, 403, 404, 500.

---

### PATCH `/api/arts/:id/limit`

Обновление лимита артикула.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path `id` — MongoDB ObjectId. Body: `{ limit: number }` (неотрицательное).

**Ответ 200:** обновлённый документ Art.

**Ошибки:** 400 (валидация), 401, 403, 404 (артикул не найден), 500.

---

### POST `/api/arts/upsert`

Массовое создание/обновление артикулов.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос body:** массив объектов: `artikul` (string), `zone` (string), опционально `nameukr`, `namerus`, `limit` (number), `marker` (string). Минимум один элемент.

**Ответ 200:** `{ message: string, result: ... }`.

**Ошибки:** 400 (валидация, поле `errors`), 401, 403, 500.

---

### PATCH `/api/arts/:artikul/btrade-stock`

Обновление btradeStock для одного артикула.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path `artikul` — строка.

**Ответ 200:** объект с сообщением и данными (структура из контроллера).

**Ошибки:** 400, 401, 403, 404, 500.

---

### POST `/api/arts/btrade-stock/update-all`

Фоновое обновление btradeStock для всех артикулов.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** без тела.

**Ответ 202:** объект с сообщением о запуске процесса.

**Ошибки:** 400, 401, 403, 500.

---

### GET `/api/arts/export`

Экспорт всех артикулов в Excel.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** без тела.

**Ответ 200:** бинарное тело (файл Excel), Content-Type для скачивания.

**Ошибки:** 401, 403, 404, 500.

---

### GET `/api/arts/export-with-stocks`

Экспорт артикулов в Excel с данными о запасах и витрине.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** без тела.

**Ответ 200:** бинарное тело (файл Excel).

**Ошибки:** 401, 403, 404, 500.

---

### DELETE `/api/arts/without-latest-marker`

Удаление всех артикулов без последнего актуального маркера.

**Доступ:** checkAuth + checkRoles(PRIME).

**Запрос:** без тела.

**Ответ 200:** `{ message: string, result: { deletedCount: number, latestMarker: string } }`.

**Ошибки:** 400, 401, 403, 500.
