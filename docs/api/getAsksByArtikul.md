# GET /api/asks/by-artikul

Получение списка заявок по артикулу.

## Эндпоинт

```
GET /api/asks/by-artikul
```

## Запрос

### Query параметры

- `artikul` (string, обязательное) - артикул товара для поиска заявок

### Пример запроса

```
GET /api/asks/by-artikul?artikul=5555-5555
```

## Ответ

### Успешный ответ (200)

```json
{
  "message": "Found 3 asks for artikul 5555-5555",
  "data": [
    {
      "_id": "...",
      "artikul": "5555-5555",
      "nameukr": "Название товара",
      "quant": 10,
      "status": "new",
      "askerData": {
        "_id": "...",
        "fullname": "Имя пользователя"
      },
      "createdAt": "2025-01-15T10:00:00.000Z",
      ...
    }
  ],
  "artikul": "5555-5555",
  "count": 3,
  "newCount": 1,
  "processingCount": 1,
  "completedCount": 1,
  "rejectedCount": 0
}
```

### Структура ответа

- `message` (string) - описание результата
- `data` (Array<Ask>) - массив заявок с указанным артикулом, отсортированных по дате создания (новые сначала)
- `artikul` (string) - артикул из запроса
- `count` (number) - общее количество найденных заявок
- `newCount` (number) - количество заявок со статусом "new"
- `processingCount` (number) - количество заявок со статусом "processing"
- `completedCount` (number) - количество заявок со статусом "completed"
- `rejectedCount` (number) - количество заявок со статусом "rejected"

### Ошибка валидации (400)

```json
{
  "message": "Validation error",
  "errors": [
    {
      "path": ["artikul"],
      "message": "Artikul is required and must be a non-empty string"
    }
  ]
}
```

### Ошибка сервера (500)

```json
{
  "message": "Server error while fetching asks by artikul",
  "error": "Error message"
}
```

## Аутентификация

Требуется JWT токен в заголовке `Authorization: Bearer <token>`.

## Права доступа

Требуется роль `USER` или выше.
