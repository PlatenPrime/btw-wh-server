# API запросов к кассе (Kasks)

Модуль **kasks** — запросы доставить товар к кассе (kasa + asks). Создание, просмотр по дате и по id, обновление и удаление. Все операции доступны любому авторизованному пользователю с ролью USER (без разграничения по владельцу).

## Эндпоинты

### POST `/api/kasks`

Создание запроса к кассе. После успешного создания уведомление уходит в **чат кассы** (`@kassabtw`, утилита `sendMessageToKasaChat`; кроме роли PRIME и окружения test). В текст включаются поля запроса; при переданном количестве — с суффиксом « шт», при отсутствии количества или комментария в сообщении выводится прочерк. Ссылка на изображение по шаблону `https://sharik.ua/images/elements_big/{artikul}_m1.jpg`.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос body — обязательные поля:**

| Поле    | Тип    | Описание        |
| ------- | ------ | --------------- |
| artikul | string | Артикул         |
| nameukr | string | Название (укр.) |
| zone    | string | Зона            |

**Запрос body — опциональные поля:**

| Поле  | Тип    | Описание   |
| ----- | ------ | ---------- |
| quant | number | Количество |
| com   | string | Комментарий |

**Ответ 201:** созданный документ Kask (включая `_id`, `createdAt`, `updatedAt`).

**Ошибки:** 400 (валидация, поле `errors`), 401, 403, 500.

---

### GET `/api/kasks/by-date`

Список запросов к кассе за конкретный календарный день (по `createdAt`).

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** query `date` — строка даты (валидная дата, парсится в Date).

**Ответ 200:**

```json
{
  "message": "Kasks retrieved successfully",
  "data": [ /* массив Kask */ ],
  "count": 0
}
```

**Ошибки:** 400 (невалидная дата), 401, 403, 500.

---

### GET `/api/kasks/:id`

Запрос к кассе по id.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path `id` — MongoDB ObjectId.

**Ответ 200:** при найденном — `{ exists: true, message, data }`; при отсутствии — `{ exists: false, message: "Kask not found", data: null }`.

**Ошибки:** 400 (невалидный id), 401, 403, 500.

---

### PATCH `/api/kasks/:id`

Частичное обновление. Должно быть передано хотя бы одно поле из списка.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path `id` — MongoDB ObjectId. Body (все опциональны, минимум одно): `artikul`, `nameukr`, `quant`, `zone`, `com`.

**Ответ 200:** `{ message: "Kask updated successfully", data }`.

**Ошибки:** 400 (валидация / пустое тело), 401, 403, 404, 500.

---

### DELETE `/api/kasks/:id`

Удаление запроса к кассе.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** path `id` — MongoDB ObjectId.

**Ответ 200:** `{ message: "Kask deleted successfully", data: { id, artikul } }`.

**Ошибки:** 400, 401, 403, 404, 500.
