# API аналогов (Analogs)

Эндпоинты для работы с аналогами артикулов у конкурентов. Чтение доступно роли USER; создание и обновление — ADMIN; удаление — только PRIME.

## Эндпоинты

### GET `/api/analogs`

Получение списка аналогов с пагинацией и фильтрами по konkName и prodName. Сортировка по артикулу.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** query-параметры:

- `konkName`: string (опционально)
- `prodName`: string (опционально)
- `search`: string (опционально) — поиск по полям nameukr и title (регистронезависимое совпадение)
- `page`: string (опционально, по умолчанию 1)
- `limit`: string (опционально, 1–100, по умолчанию 10)

**Ответ 200:** `{ message: string, data: Array<Analog>, pagination: { page, limit, total, totalPages, hasNext, hasPrev } }`.

**Ошибки:** 400 (невалидные параметры), 401, 403, 500.

---

### GET `/api/analogs/id/:id`

Получение аналога по id с добавленными полями konk и prod (id, name, title, imageUrl; при отсутствии Konk/Prod — пустые строки).

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path-параметр `id` — MongoDB ObjectId.

**Ответ 200:** `{ message: string, data: EnrichedAnalog }`, где data содержит поля документа Analog плюс `konk` и `prod`.

**Ошибки:** 400 (невалидный id), 401, 403, 404 (аналог не найден), 500.

---

### GET `/api/analogs/id/:id/stock`

Получение остатка и цены товара по аналогу. По id загружается аналог из коллекции; по полю `konkName` выбирается утилита скрапинга (air, balun, yumi, sharte), которая запрашивает данные по `url` аналога. Ответ всегда в формате `{ stock, price }`.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path-параметр `id` — MongoDB ObjectId (id аналога).

**Ответ 200:** `{ message: string, data: { stock: number, price: number } }`.

**Ошибки:** 400 (невалидный id или неподдерживаемый konkName для получения остатков), 401, 403, 404 (аналог не найден или товар не найден / данные недоступны), 500.

---

### GET `/api/analogs/prod/:prodName`

Получение аналогов по имени производителя с пагинацией и поиском. Сортировка по артикулу.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path-параметр `prodName` — строка (обязательно). Query: `page` (опционально, по умолчанию 1), `limit` (опционально, 1–100, по умолчанию 10), `search` (опционально — поиск по nameukr и title).

**Ответ 200:** `{ message: string, data: Array<Analog>, pagination: { page, limit, total, totalPages, hasNext, hasPrev } }`.

**Ошибки:** 400 (пустой prodName или невалидные query), 401, 403, 500.

---

### GET `/api/analogs/konk/:konkName`

Получение аналогов по имени конкурента с пагинацией и поиском. Сортировка по артикулу.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path-параметр `konkName` — строка (обязательно). Query: `page` (опционально, по умолчанию 1), `limit` (опционально, 1–100, по умолчанию 10), `search` (опционально — поиск по nameukr и title).

**Ответ 200:** `{ message: string, data: Array<Analog>, pagination: { page, limit, total, totalPages, hasNext, hasPrev } }`.

**Ошибки:** 400 (пустой konkName или невалидные query), 401, 403, 500.

---

### GET `/api/analogs/artikul/:artikul`

Получение аналогов по артикулу.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path-параметр `artikul` — строка (обязательно).

**Ответ 200:** `{ message: string, data: Array<Analog> }`.

**Ошибки:** 400 (пустой artikul), 401, 403, 500.

---

### POST `/api/analogs`

Создание аналога.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос body:**

- `konkName`: string (обязательно)
- `prodName`: string (обязательно)
- `url`: string (обязательно)
- `artikul`: string (опционально, по умолчанию "")
- `title`: string (опционально; обязательно, если artikul не указан)
- `imageUrl`: string (опционально; обязательно, если artikul не указан)

При указанном `artikul` поле `nameukr` заполняется из документа Art.

**Ответ 201:** `{ message: string, data: Analog }`.

**Ошибки:** 400 (валидация, при наличии — поле `errors`), 401, 403, 409 (аналог с таким url уже существует), 500.

---

### PATCH `/api/analogs/id/:id`

Изменение аналога по id. В body передаются только поля, которые нужно обновить. Необходимо передать хотя бы одно поле.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path-параметр `id` — MongoDB ObjectId. Body: `{ konkName?: string, prodName?: string, artikul?: string, nameukr?: string, url?: string, title?: string, imageUrl?: string }`. При обновлении `artikul` поле `nameukr` может подтягиваться из Art.

**Ответ 200:** `{ message: string, data: Analog }`.

**Ошибки:** 400 (валидация, пустой body), 401, 403, 404 (аналог не найден), 500.

---

### DELETE `/api/analogs/id/:id`

Удаление аналога по id.

**Доступ:** checkAuth + checkRoles(PRIME).

**Запрос:** path-параметр `id` — MongoDB ObjectId.

**Ответ 200:** `{ message: string }`.

**Ошибки:** 400 (невалидный id), 401, 403, 404 (аналог не найден), 500.

## Формат Analog

Во всех ответах, где возвращается документ аналога:

- `_id`: string (MongoDB ObjectId)
- `konkName`: string
- `prodName`: string
- `artikul`: string (по умолчанию "")
- `nameukr`: string (опционально)
- `url`: string
- `title`: string (опционально)
- `imageUrl`: string (опционально)
- `createdAt`: Date (ISO строка в JSON)
- `updatedAt`: Date (ISO строка в JSON)

В ответе getAnalogById в объект data дополнительно входят:

- `konk`: `{ id: string, name: string, title: string, imageUrl: string }` (при отсутствии Konk — пустые строки)
- `prod`: `{ id: string, name: string, title: string, imageUrl: string }` (при отсутствии Prod — пустые строки)
