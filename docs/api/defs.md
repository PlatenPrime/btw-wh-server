# API дефицитов (Defs)

Модуль live-расчёта дефицитов. Единственный эндпоинт — получение актуального расчёта.

## Эндпоинты

### GET `/api/defs/latest`

Живой расчёт дефицитов (poses pogrebi def + product_rests `actualQuantity`) с enrichment заявок.

**Доступ:** checkAuth + checkRoles(USER).

**Запрос:** без тела.

**Ответ 200:**

```
{
  exists: true,
  message: string,
  data: {
    result: {
      [artikul: string]: {
        nameukr: string,
        quant: number,
        sharikQuant: number,
        difQuant: number,
        defLimit: number,
        status: "limited" | "critical",
        existingAsk: {
          _id: string,
          status: string,
          createdAt: Date,
          askerName: string,
          askerId: string
        } | null
      }
    },
    total: number,
    totalCriticalDefs: number,
    totalLimitDefs: number,
    calculatedAt: Date
  }
}
```

При пустом наборе дефицитов `result` — `{}`, totals — `0`, `exists` остаётся `true` (расчёт выполнен).

**Ошибки:** 401, 403, 500.

Удалённые эндпоинты (больше не существуют): `POST /api/defs/calculate`, `GET /api/defs/calculation-status`.
