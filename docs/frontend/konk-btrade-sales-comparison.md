# Сравнение продаж конкурента и Btrade по дням (konk-btrade/sales-comparison)

## Назначение

Эндпоинт возвращает **агрегированные** данные о продажах и выручке конкурента vs Btrade за каждый день указанного периода, суммарно по всем артикулам группы аналогов (фильтр по конкуренту и производителю). Предназначен для построения графиков (линейных, столбчатых) и отображения итоговых показателей под графиком. Данные идентичны тем, что содержатся в Excel-отчёте `sales-comparison-excel`, но агрегированы (не детализированы по каждому артикулу).

## Эндпоинт

### GET `/api/analog-slices/konk-btrade/sales-comparison`

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
GET /api/analog-slices/konk-btrade/sales-comparison?konk=apteka_ds&prod=bayer&dateFrom=2026-03-01&dateTo=2026-03-14
```

## Формат ответа

```json
{
  "message": "Sales comparison data retrieved successfully",
  "data": {
    "days": [
      {
        "date": "2026-03-01T00:00:00.000Z",
        "competitorSales": 12,
        "competitorRevenue": 3456.78,
        "btradeSales": 15,
        "btradeRevenue": 4200.50
      },
      {
        "date": "2026-03-02T00:00:00.000Z",
        "competitorSales": 8,
        "competitorRevenue": 2100.00,
        "btradeSales": 10,
        "btradeRevenue": 2800.00
      }
    ],
    "summary": {
      "totalCompetitorSales": 150,
      "totalBtradeSales": 180,
      "totalCompetitorRevenue": 45000.00,
      "totalBtradeRevenue": 52000.00,
      "diffSalesPcs": 30,
      "diffRevenueUah": 7000.00,
      "diffSalesPct": 20.00,
      "diffRevenuePct": 15.56
    }
  }
}
```

## Описание полей

### `days` — массив ежедневных данных

Один элемент на каждый день периода (включая оба края `dateFrom` и `dateTo`). Массив отсортирован по дате по возрастанию. Подходит для прямого использования в качестве `data` для Recharts / shadcn/ui Chart (ось X — `date`).

| Поле                | Тип    | Описание |
|---------------------|--------|----------|
| `date`              | string | Дата в формате ISO (`2026-03-01T00:00:00.000Z`). Для отображения на оси X графика рекомендуется форматировать через `toLocaleDateString()` или библиотеку (date-fns, dayjs). |
| `competitorSales`   | number | Суммарные продажи конкурента по всем артикулам за этот день (шт). |
| `competitorRevenue` | number | Суммарная выручка конкурента за этот день (грн), округлена до 2 знаков. |
| `btradeSales`       | number | Суммарные продажи Btrade по всем артикулам за этот день (шт). |
| `btradeRevenue`     | number | Суммарная выручка Btrade за этот день (грн), округлена до 2 знаков. |

### `summary` — итоговые показатели

Предназначены для отображения под графиком (карточки/бейджи с ключевыми цифрами). Совпадают с итоговым блоком Excel-отчёта.

| Поле                    | Тип           | Описание |
|-------------------------|---------------|----------|
| `totalCompetitorSales`  | number        | Суммарные продажи конкурента за весь период (шт). |
| `totalBtradeSales`      | number        | Суммарные продажи Btrade за весь период (шт). |
| `totalCompetitorRevenue`| number        | Суммарная выручка конкурента за весь период (грн). |
| `totalBtradeRevenue`    | number        | Суммарная выручка Btrade за весь период (грн). |
| `diffSalesPcs`          | number        | Разница продаж: `totalBtradeSales − totalCompetitorSales` (шт). Положительное значение — Btrade продаёт больше. |
| `diffRevenueUah`        | number        | Разница выручки: `totalBtradeRevenue − totalCompetitorRevenue` (грн). |
| `diffSalesPct`          | number \| null | Разница продаж в процентах: `(btrade / competitor − 1) × 100`, округлено до 2 знаков. `null` если продажи конкурента = 0 (деление на 0). |
| `diffRevenuePct`        | number \| null | Разница выручки в процентах: `(btrade / competitor − 1) × 100`, округлено до 2 знаков. `null` если выручка конкурента = 0. |

## Логика расчёта продаж

Продажи за день вычисляются по разнице остатков: `sales = stock(предыдущий день) − stock(текущий день)`. Если остаток вырос — это день поставки, продажи считаются = 0. Если данные за предыдущий день отсутствуют — продажи = 0. Выручка = продажи × цена на этот день.

Это та же логика, что используется в эндпоинтах `sales-by-date` / `sales-range` и в Excel-отчётах сравнения продаж.

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

interface DaySalesComparison {
  date: string;
  competitorSales: number;
  competitorRevenue: number;
  btradeSales: number;
  btradeRevenue: number;
}

interface SalesComparisonSummary {
  totalCompetitorSales: number;
  totalBtradeSales: number;
  totalCompetitorRevenue: number;
  totalBtradeRevenue: number;
  diffSalesPcs: number;
  diffRevenueUah: number;
  diffSalesPct: number | null;
  diffRevenuePct: number | null;
}

interface SalesComparisonResponse {
  message: string;
  data: {
    days: DaySalesComparison[];
    summary: SalesComparisonSummary;
  };
}

export function useKonkBtradeSalesComparison(params: {
  konk: string;
  prod: string;
  dateFrom: string;
  dateTo: string;
}) {
  return useQuery({
    queryKey: ["konk-btrade-sales-comparison", params],
    queryFn: async () => {
      const { data } = await api.get<SalesComparisonResponse>(
        "/analog-slices/konk-btrade/sales-comparison",
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
const { data, isLoading } = useKonkBtradeSalesComparison({
  konk: "apteka_ds",
  prod: "bayer",
  dateFrom: "2026-03-01",
  dateTo: "2026-03-14",
});

// data.days — для графика (Recharts / shadcn/ui Chart)
// data.summary — для итоговых карточек под графиком
```

Для графика продаж (шт): `dataKey="competitorSales"` и `dataKey="btradeSales"`.
Для графика выручки (грн): `dataKey="competitorRevenue"` и `dataKey="btradeRevenue"`.

Итоговые карточки под графиком можно отобразить из `summary`:
- «Продажі конкурента: {summary.totalCompetitorSales} шт»
- «Продажі Btrade: {summary.totalBtradeSales} шт»
- «Виручка конкурента: {summary.totalCompetitorRevenue} грн»
- «Виручка Btrade: {summary.totalBtradeRevenue} грн»
- «Δ Продажі: {summary.diffSalesPcs} шт ({summary.diffSalesPct}%)»
- «Δ Виручка: {summary.diffRevenueUah} грн ({summary.diffRevenuePct}%)»
