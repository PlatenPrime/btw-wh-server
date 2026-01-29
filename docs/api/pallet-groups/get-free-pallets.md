# GET `/api/pallet-groups/free-pallets` — свободные паллеты

## Назначение

Эндпоинт возвращает список паллет, не привязанных ни к одной паллетной группе. Используется на фронте при выборе паллет для добавления в группу (например, перед вызовом `POST /api/pallet-groups/set-pallets`).

- **Метод:** GET
- **Путь:** `/api/pallet-groups/free-pallets`
- **Доступ:** роль USER и выше (заголовок `Authorization: Bearer <token>` обязателен).

## Запрос

Тело запроса не требуется. Параметры не используются.

```http
GET /api/pallet-groups/free-pallets HTTP/1.1
Host: <host>
Authorization: Bearer <token>
```

## Ответ 200

- **message** — строка об успешном выполнении (`"Free pallets fetched successfully"`).
- **data** — массив объектов в формате **PalletShortDto**, отсортированный по полю `title` (название паллеты).

### Формат элемента массива (PalletShortDto)

| Поле      | Тип     | Описание                               |
| --------- | ------- | -------------------------------------- |
| `id`      | string  | Идентификатор паллеты                  |
| `title`   | string  | Название паллеты                       |
| `sector`  | number  | Сектор (для свободных паллет обычно 0) |
| `isDef`   | boolean | Признак дефицитности                   |
| `isEmpty` | boolean | Признак пустой паллеты (нет позиций)   |

### Пример ответа

```json
{
  "message": "Free pallets fetched successfully",
  "data": [
    {
      "id": "507f1f77bcf86cd799439023",
      "title": "Паллета-B1",
      "sector": 0,
      "isDef": false,
      "isEmpty": true
    }
  ]
}
```

Пустой список свободных паллет:

```json
{
  "message": "Free pallets fetched successfully",
  "data": []
}
```

## Связанная документация

- Полное описание API модуля pallet-groups и структур данных: [docs/api/pallet-groups.md](../pallet-groups.md).
