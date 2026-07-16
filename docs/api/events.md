# API событий аудита (Events)

Чтение журнала действий пользователей. Создание событий — только внутреннее (сервер), публичного POST нет. Актор мутаций определяется JWT (`Authorization: Bearer <token>`); отдельный `userId` в теле запроса для аудита не передаётся и не принимается.

## Эндпоинты

### GET `/api/events`

Список событий с фильтрами и пагинацией (сортировка по `createdAt` убыв.).

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос query:**

- `page`: string (опционально, по умолчанию `"1"`) — номер страницы ≥ 1
- `limit`: string (опционально, по умолчанию `"20"`) — размер страницы 1–100
- `department`: string (опционально) — фильтр по домену модуля
- `userId`: string (опционально) — MongoDB ObjectId пользователя-актора
- `from`: string (опционально) — ISO-дата, нижняя граница `createdAt`
- `to`: string (опционально) — ISO-дата, верхняя граница `createdAt`

**Ответ 200:**

```
{
  message: string,
  data: Array<Event>,
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

**Ошибки:** 400 (валидация query), 401, 403, 500.

---

### GET `/api/events/id/:id`

Получение события по id.

**Доступ:** checkAuth + checkRoles(ADMIN).

**Запрос:** path-параметр `id` — MongoDB ObjectId.

**Ответ 200:** `{ message: string, data: Event }`.

**Ошибки:** 400 (невалидный id), 401, 403, 404 (событие не найдено), 500.

## Формат Event

- `_id`: string (MongoDB ObjectId)
- `userId`: string (MongoDB ObjectId) — пользователь-актор
- `userData`: object — снимок пользователя
  - `_id`: string
  - `fullname`: string
  - `telegram`: string (опционально)
  - `photo`: string (опционально)
- `department`: string — домен модуля (`constants`, `poses`, …)
- `description`: string — описание события
- `createdAt`: Date (ISO строка в JSON)
- `updatedAt`: Date (ISO строка в JSON)

## Заметка для фронтенда (аудит)

Для записи событий в журнал **не нужно** добавлять `userId` в body/query защищённых запросов. Достаточно уже используемого заголовка `Authorization: Bearer <token>`: сервер сам берёт актора из JWT и подтягивает данные пользователя. Публичного эндпоинта создания событий нет.
