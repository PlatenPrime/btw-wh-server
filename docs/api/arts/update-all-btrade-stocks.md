# POST `/api/arts/btrade-stock/update-all`

Обновление информации об остатках Btrade для всех артикулов.

## Доступ

Требует роль ADMIN.

## Запрос

**Метод:** POST

**URL:** `/api/arts/btrade-stock/update-all`

**Headers:**
- `Authorization: Bearer <token>` - JWT токен аутентификации
- `Content-Type: application/json`

**Body:** Отсутствует

## Ответы

### 202 Accepted

Процесс обновления запущен.

```json
{
  "message": "BtradeStock update process started"
}
```

### 400 Bad Request

Ошибка валидации входных данных.

```json
{
  "message": "Validation error",
  "errors": [
    {
      "path": [],
      "message": "..."
    }
  ]
}
```

### 500 Internal Server Error

Ошибка сервера.

```json
{
  "message": "Server error",
  "error": "..." // присутствует только в режиме development
}
```

## Примечания

Операция выполняется асинхронно в фоне. Ответ возвращается сразу после запуска процесса обновления, не дожидаясь его завершения. Процесс обновления может занять продолжительное время в зависимости от количества артикулов в системе.

