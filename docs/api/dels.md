# API поставок (для фронтенда)

Эндпоинты для работы с поставками (модуль Dels). Список и получение по id доступны роли USER; создание и обновление — ADMIN; удаление — только PRIME.

## Эндпоинты

### GET `/api/dels`

Получение списка поставок. В ответе только `_id`, `title`, `createdAt`, `updatedAt` (поле `artikuls` не передаётся).

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** без тела; query-параметры не используются.

**Ответ 200:** `{ message: string, data: Array<{ _id, title, createdAt, updatedAt }> }`.

**Ошибки:** 401, 500.

---

### GET `/api/dels/id/:id`

Получение поставки по id (полный документ, включая `artikuls`).

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path-параметр `id` — MongoDB ObjectId.

**Ответ 200:** `{ message: string, data: Del }`, где Del — объект с полями `_id`, `title`, `artikuls`, `createdAt`, `updatedAt`.

**Ошибки:** 400 (невалидный id), 401, 403, 404 (поставка не найдена), 500.

---

### POST `/api/dels`

Создание поставки.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос body:**

- `title`: string (обязательно)
- `artikuls`: объект «артикул → количество» (Record<string, number>), опционально, по умолчанию `{}`. Сервер подставляет `nameukr` из коллекции arts по артикулу; если артикул в arts не найден — поле не задаётся.

**Ответ 201:** `{ message: string, data: Del }`.

**Ошибки:** 400 (валидация, при наличии — поле `errors`), 401, 403, 500.

---

### DELETE `/api/dels/id/:id`

Удаление поставки по id.

**Доступ:** checkAuth + checkRoles(PRIME).

**Запрос:** path-параметр `id` — MongoDB ObjectId.

**Ответ 200:** `{ message: string }`.

**Ошибки:** 400 (невалидный id), 401, 403, 404 (поставка не найдена), 500.

---

### PATCH `/api/dels/:id/title`

Изменение названия поставки.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path-параметр `id` — MongoDB ObjectId. Body: `{ title: string }`.

**Ответ 200:** `{ message: string, data: Del }`.

**Ошибки:** 400 (валидация), 401, 403, 404, 500.

---

### PATCH `/api/dels/:id/artikuls/:artikul`

Обновление значения одного артикула в поставке данными с sharik.ua. Артикул задаётся в path. Если артикула нет в поставке — он добавляется.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path-параметры `id` (MongoDB ObjectId), `artikul` (string).

**Ответ 200:** `{ message: string, data: Del }`.

**Ошибки:** 400 (валидация), 401, 403, 404 (поставка не найдена или товар не найден на sharik.ua), 500.

---

### POST `/api/dels/:id/artikuls/update-all`

Запуск фонового обновления значений всех артикулов поставки (sharik.ua). Ответ приходит сразу, обновление идёт в фоне.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path-параметр `id` — MongoDB ObjectId.

**Ответ 202:** `{ message: string }` (процесс запущен).

**Ошибки:** 400 (невалидный id), 401, 403, 404 (поставка не найдена), 500.

## Формат Del

Во всех ответах, где возвращается полный документ поставки:

- `_id`: string (MongoDB ObjectId)
- `title`: string
- `artikuls`: объект, ключи — артикулы (string), значения — объекты `{ quantity: number, nameukr?: string }`
- `createdAt`: Date (ISO строка в JSON)
- `updatedAt`: Date (ISO строка в JSON)

В списке (GET `/api/dels`) в элементах массива поле `artikuls` отсутствует.
