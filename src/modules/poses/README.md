# Positions Module – API & Integration Guide

## Purpose

Модуль Positions (Pos) управляет позициями склада, каждая из которых принадлежит паллете и строке. API поддерживает CRUD, bulk-операции, фильтрацию и строгую типизацию. Документация полностью соответствует реальной модели.

---

## Data Model (точно как в коде)

### Position (IPos)

```typescript
import { Types } from "mongoose";

interface IPos {
  _id: Types.ObjectId;
  pallet: Types.ObjectId; // Обязательное, ссылка на Pallet
  row: Types.ObjectId; // Обязательное, ссылка на Row
  palletData: { _id: Types.ObjectId; title: string; sector?: string }; // Обязательное, кэшированные данные паллеты
  rowData: { _id: Types.ObjectId; title: string }; // Обязательное, кэшированные данные строки
  palletTitle: string; // Обязательное
  rowTitle: string; // Обязательное
  artikul: string; // Обязательное
  nameukr?: string;
  quant: number; // Обязательное
  boxes: number; // Обязательное
  date?: string;
  sklad?: string;
  createdAt?: Date;
  updatedAt?: Date;
  comment: string; // Обязательное
}
```

### Пример ответа Position

```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "pallet": "64f8a1b2c3d4e5f6a7b8c9d1",
  "row": "64f8a1b2c3d4e5f6a7b8c9d2",
  "palletData": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "title": "Pallet A",
    "sector": "Sector 1"
  },
  "rowData": { "_id": "64f8a1b2c3d4e5f6a7b8c9d2", "title": "Row A" },
  "palletTitle": "Pallet A",
  "rowTitle": "Row A",
  "artikul": "ART001",
  "nameukr": "Название",
  "quant": 100,
  "boxes": 10,
  "date": "2024-01-01",
  "sklad": "Main",
  "limit": 5,
  "comment": "Комментарий",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

## API Endpoints & Controllers

| Method | Route                          | Controller         | Описание                                  |
| ------ | ------------------------------ | ------------------ | ----------------------------------------- |
| GET    | /api/poses                     | getAllPoses        | Получить все позиции (фильтры, пагинация) |
| GET    | /api/poses/:id                 | getPosById         | Получить позицию по ObjectId              |
| GET    | /api/poses/by-pallet/:palletId | getPosesByPalletId | Получить все позиции паллеты              |
| GET    | /api/poses/by-row/:rowId       | getPosesByRowId    | Получить все позиции строки               |
| POST   | /api/poses                     | createPos          | Создать новую позицию                     |
| POST   | /api/poses/bulk                | bulkCreatePoses    | Массовое создание позиций                 |
| PUT    | /api/poses/:id                 | updatePos          | Обновить позицию по ObjectId              |
| DELETE | /api/poses/:id                 | deletePos          | Удалить позицию по ObjectId               |

---

## Endpoint Details

### 1. Получить все позиции (фильтры, пагинация)

- **GET /api/poses**
- **Query:** page, limit, palletId, rowId, artikul, sklad
- **Ответ 200:**
  ```json
  {
    "data": [Position, ...],
    "total": 50,
    "page": 1,
    "totalPages": 5
  }
  ```
- **Ответ 500:** `{ error: "Failed to fetch poses", details }`

### 2. Получить позицию по ID

- **GET /api/poses/:id**
- **Параметры:** id (ObjectId)
- **Ответ 200:** Position
- **Ответ 400:** `{ error: "Invalid position ID" }`
- **Ответ 404:** `{ error: "Position not found" }`
- **Ответ 500:** `{ error: "Failed to fetch position", details }`

### 3. Получить позиции по palletId

- **GET /api/poses/by-pallet/:palletId**
- **Параметры:** palletId (ObjectId)
- **Ответ 200:** Массив Position
- **Ответ 400:** `{ error: "Invalid pallet ID" }`
- **Ответ 500:** `{ error: "Failed to fetch poses by pallet", details }`

### 4. Получить позиции по rowId

- **GET /api/poses/by-row/:rowId**
- **Параметры:** rowId (ObjectId)
- **Ответ 200:** Массив Position
- **Ответ 400:** `{ error: "Invalid row ID" }`
- **Ответ 500:** `{ error: "Failed to fetch poses by row", details }`

### 5. Создать позицию

- **POST /api/poses**
- **Body:**
  ```json
  {
    "pallet": "ObjectId",
    "row": "ObjectId",
    "artikul": "ART001",
    "quant": 100,
    "boxes": 10,
    "date": "2024-01-01",
    "sklad": "Main",
    "limit": 5,
    "comment": "Комментарий"
  }
  ```
- **Ответ 201:** Position
- **Ответ 400:** `{ error: validation_errors }`
- **Ответ 404:** `{ error: "Pallet not found" }` или `{ error: "Row not found" }`
- **Ответ 500:** `{ error: "Failed to create position", details }`

### 6. Массовое создание позиций

- **POST /api/poses/bulk**
- **Body:**
  ```json
  {
    "poses": [
      {
        "pallet": "ObjectId",
        "row": "ObjectId",
        "artikul": "ART001",
        "quant": 100,
        "boxes": 10,
        "limit": 5,
        "comment": "..."
      },
      {
        "pallet": "ObjectId",
        "row": "ObjectId",
        "artikul": "ART002",
        "quant": 50,
        "boxes": 5,
        "limit": 2,
        "comment": "..."
      }
    ]
  }
  ```
- **Ответ 201:** `{ message: "X positions created successfully", data: [Position, ...] }`
- **Ответ 400:** `{ error: validation_errors }`
- **Ответ 404:** `{ error: "Some pallets not found" }` или `{ error: "Some rows not found" }`
- **Ответ 500:** `{ error: "Failed to create positions", details }`

### 7. Обновить позицию

- **PUT /api/poses/:id**
- **Body:**
  ```json
  {
    "pallet": "ObjectId",
    "row": "ObjectId",
    "artikul": "ART001",
    "quant": 150,
    "boxes": 15,
    "date": "2024-01-02",
    "sklad": "Secondary",
    "limit": 10,
    "comment": "Обновлено"
  }
  ```
- **Ответ 200:** Position
- **Ответ 400:** `{ error: "Invalid position ID" }` или `{ error: validation_errors }`
- **Ответ 404:** `{ error: "Position not found" }`
- **Ответ 500:** `{ error: "Failed to update position", details }`

### 8. Удалить позицию

- **DELETE /api/poses/:id**
- **Параметры:** id (ObjectId)
- **Ответ 200:** `{ message: "Position deleted successfully" }`
- **Ответ 400:** `{ error: "Invalid position ID" }`
- **Ответ 404:** `{ error: "Position not found" }`
- **Ответ 500:** `{ error: "Failed to delete position", details }`

---

## Controllers Overview

- **getAllPoses:** Все позиции, фильтры и пагинация.
- **getPosById:** Поиск по ObjectId.
- **getPosesByPalletId:** Все позиции паллеты.
- **getPosesByRowId:** Все позиции строки.
- **createPos:** Создание позиции.
- **bulkCreatePoses:** Массовое создание.
- **updatePos:** Обновление позиции.
- **deletePos:** Удаление позиции.

---

## Route Map

- `/api/poses` → getAllPoses, createPos
- `/api/poses/:id` → getPosById, updatePos, deletePos
- `/api/poses/by-pallet/:palletId` → getPosesByPalletId
- `/api/poses/by-row/:rowId` → getPosesByRowId
- `/api/poses/bulk` → bulkCreatePoses

---

## Error Handling

- Все ошибки: `{ error, details? }`
- 404: Не найдено
- 400: Некорректный запрос (например, невалидный ID, ошибка валидации)
- 500: Внутренняя ошибка

---

## Special Notes

- **pallet/row** — всегда ObjectId, **palletData/rowData** — кэшированные объекты.
- **limit/comment** — обязательные поля.
- **createdAt/updatedAt** — ISO строки.
- **Bulk-операции** — через /bulk.

---

## Frontend Integration Tips

- Используйте TanStack React Query для кэширования.
- Всегда обрабатывайте ошибки.
- Проверяйте обязательные поля (artikul, quant, boxes, limit, comment, pallet, row).
- Для отображения строк и паллет используйте rowData/palletData.
