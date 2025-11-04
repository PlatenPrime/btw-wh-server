# Get Poses by Pallet ID API

## Endpoint

```
GET /api/poses/by-pallet/:palletId
```

## Описание

Возвращает список позиций (poses) для указанного паллета с возможностью выбора сортировки.

## Параметры пути

| Параметр | Тип   | Обязательный | Описание           |
| -------- | ----- | ------------ | ------------------ |
| `palletId` | string | Да          | ID паллета (MongoDB ObjectId) |

## Query параметры

| Параметр | Тип   | Обязательный | По умолчанию | Описание                                    |
| -------- | ----- | ------------ | ------------ | ------------------------------------------- |
| `sortBy` | string | Нет          | `createdAt`  | Поле для сортировки: `artikul` или `createdAt` |
| `sortOrder` | string | Нет      | `desc`       | Направление сортировки: `asc` или `desc`      |

### Возможные значения `sortBy`:
- `artikul` - сортировка по артикулу
- `createdAt` - хронологическая сортировка по дате создания

### Возможные значения `sortOrder`:
- `asc` - по возрастанию
- `desc` - по убыванию

## Примеры запросов

### Без параметров (дефолтная сортировка - хронологическая, новые первыми)

```bash
GET /api/poses/by-pallet/507f1f77bcf86cd799439011
```

### Сортировка по артикулу (по возрастанию)

```bash
GET /api/poses/by-pallet/507f1f77bcf86cd799439011?sortBy=artikul&sortOrder=asc
```

### Сортировка по артикулу (по убыванию)

```bash
GET /api/poses/by-pallet/507f1f77bcf86cd799439011?sortBy=artikul&sortOrder=desc
```

### Хронологическая сортировка (старые первыми)

```bash
GET /api/poses/by-pallet/507f1f77bcf86cd799439011?sortBy=createdAt&sortOrder=asc
```

### Хронологическая сортировка (новые первыми) - дефолт

```bash
GET /api/poses/by-pallet/507f1f77bcf86cd799439011?sortBy=createdAt&sortOrder=desc
```

## Успешный ответ

**Статус:** `200 OK`

**Тело ответа:** Массив объектов позиций

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "pallet": "507f1f77bcf86cd799439012",
    "row": "507f1f77bcf86cd799439013",
    "palletData": {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Паллета 1",
      "sector": "A",
      "isDef": false
    },
    "rowData": {
      "_id": "507f1f77bcf86cd799439013",
      "title": "Ряд 1"
    },
    "palletTitle": "Паллета 1",
    "rowTitle": "Ряд 1",
    "artikul": "ART001",
    "nameukr": "Назва товару",
    "quant": 10,
    "boxes": 2,
    "date": "2024-01-15",
    "sklad": "Склад 1",
    "comment": "Комментарий",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

## Ошибки

### 400 Bad Request - Неверный ID паллета

```json
{
  "error": "Invalid pallet ID"
}
```

### 400 Bad Request - Неверные query параметры

```json
{
  "error": "Invalid query parameters",
  "details": [
    {
      "code": "invalid_enum_value",
      "path": ["sortBy"],
      "message": "Invalid enum value. Expected 'artikul' | 'createdAt', received 'invalid'"
    }
  ]
}
```

### 500 Internal Server Error

```json
{
  "error": "Failed to fetch poses by pallet",
  "details": "..."
}
```

## Требования к аутентификации

- Endpoint требует аутентификации через JWT токен
- Требуется роль: `USER` или выше
- Токен должен быть передан в заголовке `Authorization: Bearer <token>`

## Пример использования (JavaScript/TypeScript)

### Fetch API

```typescript
const getPosesByPalletId = async (
  palletId: string,
  sortBy: 'artikul' | 'createdAt' = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc'
) => {
  const token = localStorage.getItem('authToken');
  
  const params = new URLSearchParams({
    sortBy,
    sortOrder,
  });
  
  const response = await fetch(
    `/api/poses/by-pallet/${palletId}?${params}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch poses');
  }
  
  return await response.json();
};

// Использование
const poses = await getPosesByPalletId('507f1f77bcf86cd799439011');
```

### Axios

```typescript
import axios from 'axios';

const getPosesByPalletId = async (
  palletId: string,
  sortBy: 'artikul' | 'createdAt' = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc'
) => {
  const token = localStorage.getItem('authToken');
  
  const response = await axios.get(
    `/api/poses/by-pallet/${palletId}`,
    {
      params: { sortBy, sortOrder },
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  return response.data;
};

// Использование
const poses = await getPosesByPalletId(
  '507f1f77bcf86cd799439011',
  'artikul',
  'asc'
);
```

## Примечания

- По умолчанию используется сортировка по `createdAt` в порядке убывания (новые позиции первыми)
- Если позиций для указанного паллета не найдено, возвращается пустой массив `[]`
- Все даты в ответе представлены в формате ISO 8601 (UTC)

