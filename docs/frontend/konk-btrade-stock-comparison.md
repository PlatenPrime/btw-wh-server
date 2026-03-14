# Сравнение остатков конкурента и Btrade по дням (konk-btrade/stock-comparison)

## Назначение

Эндпоинт возвращает **агрегированные** суммарные остатки конкурента vs Btrade за каждый день указанного периода, суммарно по всем артикулам группы аналогов (фильтр по конкуренту и производителю). Предназначен для построения графиков (линейных, столбчатых) и отображения итоговых показателей динамики остатков под графиком. Данные соответствуют суммарным остаткам из Excel-отчёта `comparison-excel`, но агрегированы (не детализированы по каждому артикулу).

## Эндпоинт

### GET `/api/analog-slices/konk-btrade/stock-comparison`

**Авторизация:** требуется JWT в заголовке `Authorization: Bearer <token>`. Роль: USER.

**Query-параметры:**

| Параметр   | Тип    | Обязательный | Описание                                             |
|------------|--------|:------------:|------------------------------------------------------|
| `konk`     | string | да           | Ключ конкурента (`Konk.name`)                        |
| `prod`     | string | да           | Ключ производителя (`Prod.name`)                     |
| `dateFrom` | string | да           | Начало периода, формат `YYYY-MM-DD`                  |
| `dateTo`   | string | да           | Конец периода, формат `YYYY-MM-DD`, должен быть ≥ `dateFrom` |

**Пример запроса:**

```
GET /api/analog-slices/konk-btrade/stock-comparison?konk=apteka_ds&prod=bayer&dateFrom=2026-03-01&dateTo=2026-03-14
```

## Формат ответа

```json
{
  "message": "Stock comparison data retrieved successfully",
  "data": {
    "days": [
      {
        "date": "2026-03-01T00:00:00.000Z",
        "competitorStock": 150,
        "btradeStock": 300
      },
      {
        "date": "2026-03-02T00:00:00.000Z",
        "competitorStock": 130,
        "btradeStock": 275
      }
    ],
    "summary": {
      "firstDayCompetitorStock": 150,
      "lastDayCompetitorStock": 120,
      "firstDayBtradeStock": 300,
      "lastDayBtradeStock": 270,
      "diffCompetitorStock": -30,
      "diffBtradeStock": -30,
      "diffCompetitorStockPct": -20.00,
      "diffBtradeStockPct": -10.00
    }
  }
}
```

## Описание полей

### `days` — массив ежедневных данных

Один элемент на каждый день периода (включая оба края `dateFrom` и `dateTo`). Массив отсортирован по дате по возрастанию. Подходит для прямого использования в качестве `data` для Recharts / shadcn/ui Chart (ось X — `date`).

| Поле              | Тип    | Описание |
|-------------------|--------|----------|
| `date`            | string | Дата в формате ISO (`2026-03-01T00:00:00.000Z`). Для отображения на оси X графика рекомендуется форматировать через `toLocaleDateString()` или библиотеку (date-fns, dayjs). |
| `competitorStock` | number | Суммарные остатки конкурента по всем артикулам за этот день (шт). Если для артикула нет данных — считается как 0. |
| `btradeStock`     | number | Суммарные остатки Btrade по всем артикулам за этот день (шт). Если для артикула нет данных — считается как 0. |

### `summary` — итоговые показатели

Предназначены для отображения под графиком (карточки/бейджи с ключевыми цифрами динамики остатков за период).

| Поле                       | Тип           | Описание |
|----------------------------|---------------|----------|
| `firstDayCompetitorStock`  | number        | Суммарный остаток конкурента на первый день периода (шт). |
| `lastDayCompetitorStock`   | number        | Суммарный остаток конкурента на последний день периода (шт). |
| `firstDayBtradeStock`      | number        | Суммарный остаток Btrade на первый день периода (шт). |
| `lastDayBtradeStock`       | number        | Суммарный остаток Btrade на последний день периода (шт). |
| `diffCompetitorStock`      | number        | Изменение остатка конкурента: `lastDay − firstDay` (шт). Отрицательное значение — остаток уменьшился. |
| `diffBtradeStock`          | number        | Изменение остатка Btrade: `lastDay − firstDay` (шт). |
| `diffCompetitorStockPct`   | number \| null | Изменение остатка конкурента в процентах: `(diff / firstDay) × 100`, округлено до 2 знаков. `null` если остаток на первый день = 0 (деление на 0). |
| `diffBtradeStockPct`       | number \| null | Изменение остатка Btrade в процентах: `(diff / firstDay) × 100`, округлено до 2 знаков. `null` если остаток на первый день = 0. |

## Обработка ошибок

| Код  | Когда                                           | Тело ответа |
|------|-------------------------------------------------|-------------|
| `400`| Невалидные параметры (пустые `konk`/`prod`, неверный формат дат, `dateFrom > dateTo`) | `{ message: "Validation error", errors: [...] }` |
| `401`| Отсутствует или невалидный JWT                  | `{ message: "..." }` |
| `403`| Недостаточно прав (не роль USER)                | `{ message: "..." }` |
| `404`| Нет аналогов для пары `konk`/`prod`             | `{ message: "Analogs not found for provided konk/prod" }` |
| `500`| Внутренняя ошибка сервера                       | `{ message: "..." }` |

## Пример использования (React + TanStack Query)

```typescript
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface DayStockComparison {
  date: string;
  competitorStock: number;
  btradeStock: number;
}

interface StockComparisonSummary {
  firstDayCompetitorStock: number;
  lastDayCompetitorStock: number;
  firstDayBtradeStock: number;
  lastDayBtradeStock: number;
  diffCompetitorStock: number;
  diffBtradeStock: number;
  diffCompetitorStockPct: number | null;
  diffBtradeStockPct: number | null;
}

interface StockComparisonResponse {
  message: string;
  data: {
    days: DayStockComparison[];
    summary: StockComparisonSummary;
  };
}

export function useKonkBtradeStockComparison(params: {
  konk: string;
  prod: string;
  dateFrom: string;
  dateTo: string;
}) {
  return useQuery({
    queryKey: ["konk-btrade-stock-comparison", params],
    queryFn: async () => {
      const { data } = await api.get<StockComparisonResponse>(
        "/analog-slices/konk-btrade/stock-comparison",
        { params },
      );
      return data.data;
    },
    enabled: Boolean(params.konk && params.prod && params.dateFrom && params.dateTo),
  });
}
```

### Использование в компоненте графика

```tsx
const { data, isLoading } = useKonkBtradeStockComparison({
  konk: "apteka_ds",
  prod: "bayer",
  dateFrom: "2026-03-01",
  dateTo: "2026-03-14",
});

// data.days — для графика (Recharts / shadcn/ui Chart)
// data.summary — для итоговых карточек под графиком
```

Для графика остатков (шт): `dataKey="competitorStock"` и `dataKey="btradeStock"`.

Итоговые карточки под графиком можно отобразить из `summary`:
- «Залишок конкурента (початок): {summary.firstDayCompetitorStock} шт»
- «Залишок конкурента (кінець): {summary.lastDayCompetitorStock} шт»
- «Залишок Btrade (початок): {summary.firstDayBtradeStock} шт»
- «Залишок Btrade (кінець): {summary.lastDayBtradeStock} шт»
- «Δ Залишок конкурента: {summary.diffCompetitorStock} шт ({summary.diffCompetitorStockPct}%)»
- «Δ Залишок Btrade: {summary.diffBtradeStock} шт ({summary.diffBtradeStockPct}%)»
