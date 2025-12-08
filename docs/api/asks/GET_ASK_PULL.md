# API: Получить позиции для снятия товара по Ask

## Описание

Эндпоинт автоматически определяет, какие позиции и в каком количестве нужно снять для конкретного ask, основываясь на:

- Запрашиваемом количестве товара (`ask.quant`)
- Уже снятом количестве (`ask.pullQuant`)
- Остатках в позициях с таким же артикулом **и складом** (склад берется из `ask.sklad`, по умолчанию `"pogrebi"`)
- Секторах паллет (приоритет сортировки по возрастанию)

## Эндпоинт

```
GET /api/asks/:id/pull
```

## Авторизация

Требуется авторизация. Доступно для всех ролей (USER, ADMIN, PRIME).

## Параметры запроса

### Path параметры

| Параметр | Тип      | Обязательный | Описание                           |
| -------- | -------- | ------------ | ---------------------------------- |
| `id`     | `string` | Да           | ID ask (валидный MongoDB ObjectId) |

## Формат ответа

### Успешный ответ (200 OK)

```typescript
{
  exists: boolean;
  message: string;
  data: GetAskPullResponse | null;
}
```

### Структура `GetAskPullResponse`

```typescript
interface GetAskPullResponse {
  /** Флаг необходимости снятия товара */
  isPullRequired: boolean;

  /** Список позиций для снятия, отсортированных по сектору паллеты (по возрастанию) */
  positions: IPositionForPull[];

  /** Оставшееся количество для снятия (null если quant не указан в ask) */
  remainingQuantity: number | null;

  /** Статус снятия */
  status: "process" | "satisfied" | "no_poses" | "finished";
  
  /** Сообщение для пользователя */
  message: string;
}
```

### Структура `IPositionForPull`

Позиция содержит все поля стандартной позиции (IPos) плюс дополнительное поле:

```typescript
interface IPositionForPull {
  _id: string; // ObjectId позиции
  pallet: string; // ObjectId паллеты
  row: string; // ObjectId ряда
  palletData: {
    _id: string;
    title: string;
    sector?: string; // Сектор паллеты (для сортировки)
    isDef: boolean;
  };
  rowData: {
    _id: string;
    title: string;
  };
  palletTitle: string;
  rowTitle: string;
  artikul: string;
  nameukr?: string;
  quant: number; // Текущее количество на позиции
  boxes: number; // Текущее количество коробок
  date?: string;
  sklad?: string;
  comment?: string;
  createdAt?: Date;
  updatedAt?: Date;

  /** Количество для снятия с этой позиции (null если quant не указан в ask) */
  plannedQuant: number | null;
}
```

## Логика работы

### Сценарий 1: `quant` не указан в ask

- Возвращается **одна позиция** с наименьшим значением сектора паллеты
- `plannedQuant = null`
- `remainingQuantity = null`
- `isPullRequired = true` (если есть позиции)

### Сценарий 2: `quant` указан в ask

- Позиции сортируются по сектору паллеты (по возрастанию)
- Распределяется оставшееся количество (`ask.quant - ask.pullQuant`) между позициями
- Для каждой позиции `plannedQuant = min(remaining, pos.quant)`
- Если позиций недостаточно для покрытия всего оставшегося количества → возвращаются все доступные позиции с их остатками
- `remainingQuantity = ask.quant - ask.pullQuant` (или `null` если уже все снято)
- `isPullRequired = true` (если `remainingQuantity > 0`)
- `status = "process"` (если нужно снимать) или `"satisfied"` (если все снято)

### Сценарий 3: Позиций с таким артикулом и складом нет

- Возвращается пустой массив позиций
- `isPullRequired = false`
- `remainingQuantity` сохраняется (может быть `null` или числом)
- `status = "no_poses"`
- `message = "Позицій для зняття не знайдено"`

### Сценарий 4: Ask не найден

- `exists = false`
- `data = null`
- `message = "Ask not found"`

### Фильтрация по складу

- Позиции фильтруются по складу, указанному в `ask.sklad`
- Если `ask.sklad` не указан, используется склад "pogrebi" (по умолчанию)
- Возвращаются только позиции с совпадающим артикулом **и** складом

### Флаг `isPullRequired`

- `false` если:
  - Позиций с таким артикулом и складом нет
  - `remainingQuantity <= 0` (уже все снято)
- `true` во всех остальных случаях

## Коды ошибок

### 400 Bad Request

Валидация параметров не пройдена:

```json
{
  "message": "Validation error",
  "errors": [
    {
      "path": ["id"],
      "message": "Invalid ask ID format"
    }
  ]
}
```

### 500 Internal Server Error

Внутренняя ошибка сервера:

```json
{
  "message": "Server error while fetching ask pull positions",
  "error": "Error message"
}
```

## Примеры запросов

### Пример 1: Запрос позиций для снятия

```http
GET /api/asks/507f1f77bcf86cd799439011/pull
Authorization: Bearer <token>
```

### Пример 2: Успешный ответ

```json
{
  "exists": true,
  "message": "Ask pull positions retrieved successfully",
  "data": {
    "isPullRequired": true,
    "status": "process",
    "message": "Знімати потрібно",
    "remainingQuantity": 50,
    "positions": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "artikul": "ART-123",
        "palletTitle": "Паллета-1",
        "rowTitle": "Ряд-1",
        "palletData": {
          "_id": "507f1f77bcf86cd799439013",
          "title": "Паллета-1",
          "sector": "1",
          "isDef": false
        },
        "rowData": {
          "_id": "507f1f77bcf86cd799439014",
          "title": "Ряд-1"
        },
        "quant": 30,
        "boxes": 3,
        "plannedQuant": 30
      },
      {
        "_id": "507f1f77bcf86cd799439015",
        "artikul": "ART-123",
        "palletTitle": "Паллета-2",
        "rowTitle": "Ряд-1",
        "palletData": {
          "_id": "507f1f77bcf86cd799439016",
          "title": "Паллета-2",
          "sector": "2",
          "isDef": false
        },
        "rowData": {
          "_id": "507f1f77bcf86cd799439014",
          "title": "Ряд-1"
        },
        "quant": 25,
        "boxes": 2,
        "plannedQuant": 20
      }
    ]
  }
}
```

### Пример 3: Ask не найден

```json
{
  "exists": false,
  "message": "Ask not found",
  "data": null
}
```

### Пример 4: Quant не указан в ask

```json
{
  "exists": true,
  "message": "Ask pull positions retrieved successfully",
  "data": {
    "isPullRequired": true,
    "status": "process",
    "message": "Знімати потрібно",
    "remainingQuantity": null,
    "positions": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "artikul": "ART-123",
        "quant": 30,
        "boxes": 3,
        "plannedQuant": null
      }
    ]
  }
}
```

### Пример 5: Позиций нет

```json
{
  "exists": true,
  "message": "Ask pull positions retrieved successfully",
  "data": {
    "isPullRequired": false,
    "status": "no_poses",
    "message": "Позицій для зняття не знайдено",
    "remainingQuantity": 50,
    "positions": []
  }
}
```

### Пример 6: Уже все снято

```json
{
  "exists": true,
  "message": "Ask pull positions retrieved successfully",
  "data": {
    "isPullRequired": false,
    "status": "satisfied",
    "message": "Знімати більше нічого не потрібно",
    "remainingQuantity": null,
    "positions": []
  }
}
```

## Примечания

1. **Фильтрация по складу:** Позиции фильтруются по складу из `ask.sklad`. Если склад не указан в ask, используется "pogrebi" по умолчанию. Это гарантирует, что возвращаются позиции только с нужного склада (pogrebi или merezhi).
2. Позиции автоматически сортируются по сектору паллеты (по возрастанию)
3. Если у паллеты нет сектора (`sector === null/undefined`), она считается как сектор 0
4. Распределение количества идет последовательно по отсортированным позициям до покрытия всего `remainingQuantity`
5. Если доступного количества на всех позициях недостаточно, возвращаются все доступные позиции с их остатками
6. Поле `plannedQuant` показывает, сколько нужно снять с конкретной позиции
7. Поле `quant` показывает текущее количество на позиции
8. Флаг `isPullRequired` позволяет фронтенду понять, нужно ли показывать интерфейс для снятия товара
