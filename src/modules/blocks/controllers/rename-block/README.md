# Rename Block API

## Overview

Специализированный endpoint для переименования блока. Обновляет только поле `title`, не затрагивая другие поля блока.

**Endpoint:** `PATCH /api/blocks/:id/rename`  
**Authentication:** Bearer Token required  
**Authorization:** ADMIN role required

## Request

### Path Parameters

- `id` (string, required) - MongoDB ObjectId блока

### Request Body

```typescript
{
  title: string; // Required: новое название блока (минимум 1 символ, должно быть уникальным)
}
```

### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

## Response

### Success Response (200)

```typescript
{
  message: "Block renamed successfully",
  data: {
    _id: string;
    title: string; // Новое название
    order: number;
    segs: string[]; // Массив Segment ObjectIds
    createdAt: string;
    updatedAt: string;
  }
}
```

### Error Responses

#### 400 Bad Request
```typescript
{
  message: "Invalid block ID format" | "Validation error",
  errors?: Array<{
    path: string[];
    message: string;
  }>
}
```

#### 404 Not Found
```typescript
{
  message: "Block not found"
}
```

#### 409 Conflict
```typescript
{
  message: "Block with this title already exists",
  duplicateFields: ["title"]
}
```

#### 500 Server Error
```typescript
{
  message: "Server error",
  error?: any // Только в development режиме
}
```

## Example Usage

### JavaScript/TypeScript

```typescript
const renameBlock = async (blockId: string, newTitle: string) => {
  const response = await fetch(`/api/blocks/${blockId}/rename`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title: newTitle }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};

// Использование
const result = await renameBlock("507f1f77bcf86cd799439011", "New Block Name");
console.log(result.data.title); // "New Block Name"
```

### TanStack Query Hook

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

const useRenameBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const response = await fetch(`/api/blocks/${id}/rename`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to rename block");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocks"] });
      queryClient.invalidateQueries({ queryKey: ["segs"] });
    },
  });
};

// Использование в компоненте
const RenameBlockButton = ({ blockId }: { blockId: string }) => {
  const renameBlock = useRenameBlock();

  const handleRename = () => {
    renameBlock.mutate(
      { id: blockId, title: "New Name" },
      {
        onSuccess: () => {
          console.log("Block renamed successfully");
        },
        onError: (error) => {
          console.error("Failed to rename:", error.message);
        },
      }
    );
  };

  return (
    <button onClick={handleRename} disabled={renameBlock.isPending}>
      {renameBlock.isPending ? "Renaming..." : "Rename Block"}
    </button>
  );
};
```

## Validation Rules

- `id`: Должен быть валидным MongoDB ObjectId
- `title`: 
  - Обязательное поле
  - Минимум 1 символ
  - Должно быть уникальным (не должно совпадать с названием другого блока)

## Important Notes

- Обновляется только поле `title`, остальные поля блока остаются без изменений
- Сектора зон **НЕ** пересчитываются автоматически при переименовании
- Новое название должно быть уникальным - если блок с таким названием уже существует, вернется ошибка 409
- После успешного переименования рекомендуется инвалидировать кэш блоков и сегментов

## Related Endpoints

- `PUT /api/blocks/:id` - Обновление блока (может обновить title и другие поля)
- `GET /api/blocks/:id` - Получение информации о блоке
- `GET /api/blocks/` - Получение списка всех блоков

## See Also

Полная документация модуля Blocks: [BLOCKS_FRONTEND_DOCUMENTATION.md](../../BLOCKS_FRONTEND_DOCUMENTATION.md)

