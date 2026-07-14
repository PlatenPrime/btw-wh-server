# API Slice Compensation

Базовый путь: `/api/slice-compensation`

Роль: минимум **ADMIN**. JWT обязателен.

## POST `/run`

Внеочередной compensating refetch сегодняшних `AnalogSlice` и `SkuSlice` для одного конкурента. Не создаёт новый документ среза — обновляет «битые» ключи в `data`. Дата всегда сегодняшний `sliceDate` (Europe/Kiev).

### Request body

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `konkName` | string | да | Имя конкурента; нормализуется (`trim` + lowercase) |

### Responses

**200** — завершено

```
{
  message: string,
  data: {
    konkName: string,
    sliceDate: string,          // YYYY-MM-DD
    analog: { refetched: number, updated: number },
    sku: { refetched: number, updated: number }
  }
}
```

**400** — ошибка валидации

```
{
  message: "Validation error",
  errors: ZodIssue[]
}
```

**401** — нет/невалидный JWT

**403** — роль ниже ADMIN

**409** — такой же `konkName` уже в компенсирующем run на этом инстансе

```
{
  message: "Compensating slice already running for this competitor"
}
```

**500** — необработанная ошибка выполнения

```
{
  message: "Failed to run compensating slice"
}
```
