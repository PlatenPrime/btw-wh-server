# API поставок (Dels)

Модуль поставок. Список и получение по id — USER; создание, обновление заголовка и артикулов — ADMIN; удаление — PRIME.

## Эндпоинты

### GET `/api/dels`

Список поставок (без или с полем artikuls — по реализации getAllDelsUtil).

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** без тела.

**Ответ 200:** `{ message: string, data: Array<DelListItem> }` (каждый элемент: `_id`, `title`, `prodName`, `prod` (опционально), `createdAt`, `updatedAt`; без `artikuls`).

**Ошибки:** 401, 403, 500.

---

### GET `/api/dels/id/:id`

Поставка по id (полный документ).

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path `id` — MongoDB ObjectId.

**Ответ 200:** `{ message: string, data: Del }`.

**Ошибки:** 400 (невалидный id), 401, 403, 404 (поставка не найдена), 500.

---

### POST `/api/dels`

Создание поставки.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос body:** `title` (string, обязательно), `prodName` (string, обязательно; должен существовать в справочнике производителей как `Prod.name`), `artikuls` (объект «артикул → число», опционально, по умолчанию {}).

**Ответ 201:** `{ message: string, data: Del }`.

**Ошибки:** 400 (валидация, поле `errors`; или сообщение «Производитель с указанным name не найден»), 401, 403, 500.

---

### DELETE `/api/dels/id/:id`

Удаление поставки.

**Доступ:** checkAuth + checkRoles(PRIME).

**Запрос:** path `id` — MongoDB ObjectId.

**Ответ 200:** сообщение об удалении.

**Ошибки:** 400 (невалидный id), 401, 403, 404, 500.

---

### PATCH `/api/dels/:id/title`

Обновление названия и производителя поставки (одна форма на фронте: оба поля в теле запроса).

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path `id` — MongoDB ObjectId; body: `{ title: string, prodName: string }` (оба обязательны; `prodName` должен существовать в справочнике производителей как `Prod.name`).

**Ответ 200:** обновлённая поставка (message/data).

**Ошибки:** 400 (валидация или производитель не найден), 401, 403, 404 (поставка не найдена), 500.

---

### PATCH `/api/dels/:id/artikuls/:artikul`

Обновление одного артикула в поставке (данные с sharik.ua).

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path `id` — MongoDB ObjectId, `artikul` — строка.

**Ответ 200:** `{ message: string, data: Del }`.

**Ошибки:** 400, 401, 403, 404 (поставка не найдена или товар не найден на sharik.ua), 500.

---

### POST `/api/dels/:id/artikuls/update-all`

Запуск фонового обновления всех артикулов поставки (sharik.ua).

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path `id` — MongoDB ObjectId.

**Ответ 202:** `{ message: string }`.

**Ошибки:** 400, 401, 403, 404, 500.

## Формат Del

- `_id`: string (MongoDB ObjectId)
- `title`: string
- `prodName`: string (соответствует `Prod.name`, производитель поставки)
- `prod`: объект (опционально; у старых документов может отсутствовать): `{ title: string, imageUrl: string }` — данные производителя из справочника Prod
- `artikuls`: объект, ключ — артикул (string), значение — `{ quantity: number, nameukr?: string }`
- `createdAt`: Date (ISO строка)
- `updatedAt`: Date (ISO строка)
