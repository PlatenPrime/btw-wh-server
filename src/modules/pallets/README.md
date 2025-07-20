# Pallets Module – API & Integration Guide

## Purpose

Модуль Pallets управляет паллетами склада, каждая из которых принадлежит строке (row) и содержит позиции (poses). API поддерживает CRUD, управление позициями и строгую типизацию. Документация полностью соответствует реальной модели.

---

## Data Model (точно как в коде)

### Pallet (IPallet)

```typescript
import { Types } from "mongoose";

interface IPallet {
  _id: Types.ObjectId;
  title: string; // Обязательное, уникальное
  row: Types.ObjectId; // Обязательное, ссылка на Row
  rowData: { _id: Types.ObjectId; title: string }; // Обязательное, кэшированные данные строки
  poses: Types.ObjectId[]; // Массив ObjectId позиций
  sector?: string; // Необязательное
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Пример ответа Pallet

```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "title": "Pallet A",
  "row": "64f8a1b2c3d4e5f6a7b8c9d1",
  "rowData": { "_id": "64f8a1b2c3d4e5f6a7b8c9d1", "title": "Row A" },
  "poses": ["64f8a1b2c3d4e5f6a7b8c9d2", "64f8a1b2c3d4e5f6a7b8c9d3"],
  "sector": "Sector 1",
  "createdAt": "2023-09-06T10:30:00.000Z",
  "updatedAt": "2023-09-06T10:30:00.000Z"
}
```

---

## API Endpoints & Controllers

| Method | Route                      | Controller           | Описание                                |
| ------ | -------------------------- | -------------------- | --------------------------------------- |
| GET    | /api/pallets               | getAllPallets        | Получить все паллеты                    |
| GET    | /api/pallets/:id           | getPalletById        | Получить паллету по ObjectId            |
| GET    | /api/pallets/by-row/:rowId | getAllPalletsByRowId | Получить все паллеты строки             |
| POST   | /api/pallets               | createPallet         | Создать новую паллету                   |
| PUT    | /api/pallets/:id           | updatePallet         | Обновить паллету по ObjectId            |
| DELETE | /api/pallets/:id           | deletePallet         | Удалить паллету (каскадно удаляет позы) |
| DELETE | /api/pallets/:id/poses     | deletePalletPoses    | Удалить все позиции паллеты             |
| POST   | /api/pallets/move-poses    | movePalletPoses      | Переместить позиции между паллетами     |

---

## Endpoint Details

### 1. Получить все паллеты

- **GET /api/pallets**
- **Ответ 200:** Массив объектов IPallet (см. пример выше)
- **Ответ 500:** `{ message: "Server error", error }`

### 2. Получить паллету по ID

- **GET /api/pallets/:id**
- **Параметры:** id (ObjectId)
- **Ответ 200:** IPallet
- **Ответ 404:** `{ message: "Pallet not found" }`
- **Ответ 500:** `{ message: "Server error", error }`

### 3. Получить паллеты по rowId

- **GET /api/pallets/by-row/:rowId**
- **Параметры:** rowId (ObjectId)
- **Ответ 200:** Массив IPallet
- **Ответ 500:** `{ message: "Server error", error }`

### 4. Создать паллету

- **POST /api/pallets**
- **Body:**
  ```json
  { "title": "New Pallet", "row": "ObjectId", "sector": "Sector 2" }
  ```
- **Ответ 201:** IPallet
- **Ответ 400:** `{ message: "Title and row are required" }`
- **Ответ 409:** `{ message: "Pallet title must be unique" }`
- **Ответ 500:** `{ message: "Server error", error }`

### 5. Обновить паллету

- **PUT /api/pallets/:id**
- **Body:**
  ```json
  { "title": "Updated Title", "row": "ObjectId", "sector": "..." }
  ```
- **Ответ 200:** IPallet
- **Ответ 404:** `{ message: "Pallet not found" }`
- **Ответ 409:** `{ message: "Pallet title must be unique" }`
- **Ответ 500:** `{ message: "Server error", error }`

### 6. Удалить паллету (каскадно)

- **DELETE /api/pallets/:id**
- **Ответ 200:** `{ message: "Pallet and related positions deleted" }`
- **Ответ 404:** `{ message: "Pallet not found" }`
- **Ответ 500:** `{ message: "Server error", error }`

### 7. Удалить все позиции паллеты

- **DELETE /api/pallets/:id/poses**
- **Ответ 200:** `{ message: "Pallet positions deleted" }`
- **Ответ 404:** `{ message: "Pallet not found" }`
- **Ответ 500:** `{ message: "Server error", error }`

### 8. Переместить позиции между паллетами

- **POST /api/pallets/move-poses**
- **Body:**
  ```json
  { "fromPalletId": "...", "toPalletId": "...", "positionIds": ["..."] }
  ```
- **Ответ 200:** `{ message: "Positions moved successfully" }`
- **Ответ 500:** `{ message: "Server error", error }`

---

## Controllers Overview

- **getAllPallets:** Все паллеты.
- **getPalletById:** Поиск по ObjectId.
- **getAllPalletsByRowId:** Все паллеты строки.
- **createPallet:** Создание (title уникален).
- **updatePallet:** Обновление title/row/sector.
- **deletePallet:** Каскадное удаление паллеты и поз.
- **deletePalletPoses:** Удаление всех позиций паллеты.
- **movePalletPoses:** Перемещение позиций между паллетами.

---

## Route Map

- `/api/pallets` → getAllPallets, createPallet
- `/api/pallets/:id` → getPalletById, updatePallet, deletePallet
- `/api/pallets/by-row/:rowId` → getAllPalletsByRowId
- `/api/pallets/:id/poses` → deletePalletPoses
- `/api/pallets/move-poses` → movePalletPoses

---

## Error Handling

- Все ошибки: `{ message, error? }`
- 404: Не найдено
- 409: Нарушение уникальности
- 400: Некорректный запрос (например, нет title/row)
- 500: Внутренняя ошибка

---

## Special Notes

- **row** — всегда ObjectId, **rowData** — кэшированный объект.
- **poses** — массив ObjectId.
- **sector** — опционально.
- **createdAt/updatedAt** — ISO строки.
- **Удаление паллеты** — всегда удаляет все связанные позиции (каскадно).

---

## Frontend Integration Tips

- Используйте TanStack React Query для кэширования.
- Всегда обрабатывайте ошибки.
- Проверяйте обязательные поля (title, row).
- Для получения строк — используйте rowData.
