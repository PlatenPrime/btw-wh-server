# Промпт бекенду: sku-selection без ліміту 100 + selectAll

Фронт уже оновлений. Підтягни API й **документацію в бекенд-репозиторії** під новий контракт. Копії `docs/backend/**` у фронт-репо не чіпай з боку цього таска — оновлюй docs там, де живе бекенд.

## Що змінилось (коротко)

1. Знято будь-який верхній ліміт кількості SKU у selection (було 1..100).
2. Додано режим **`selectAll: true`**: бекенд сам резолвить усі SKU за тими ж фільтрами, що `GET /skus` (`search`, `konkName`, `prodName`), включно з тими, які фронт не довантажив через пагінацію.
3. Те саме для pie: `POST /api/sku-chart-reports/selection/skus-pie`.

Kinds excel-jobs без зміни імен:

- `sku-selection-stock`
- `sku-selection-sales`

## Params excel-jobs

Спільні: `dateFrom`, `dateTo` (`YYYY-MM-DD`, `dateFrom ≤ dateTo`); опційні `metrics` як раніше.

### Режим A — ручний список

```json
{
  "kind": "sku-selection-stock",
  "params": {
    "skuIds": ["ObjectId", "..."],
    "dateFrom": "2026-11-01",
    "dateTo": "2026-11-04",
    "metrics": ["stock", "price"]
  }
}
```

- `skuIds`: масив валідних Mongo ObjectId, **≥ 1, без upper bound**.
- Порядок = порядок у файлі/частках, як раніше.
- **Не** приймати / не вимагати `selectAll`.

### Режим B — усі за вибіркою

```json
{
  "kind": "sku-selection-sales",
  "params": {
    "selectAll": true,
    "search": "Happy Birthday",
    "konkName": "ivvo",
    "prodName": "APT-SHOW",
    "dateFrom": "2026-11-01",
    "dateTo": "2026-11-04",
    "metrics": ["sales", "price", "revenue"]
  }
}
```

| Поле        | Обовʼязково    | Примітка                                               |
| ----------- | -------------- | ------------------------------------------------------ |
| `selectAll` | так (`true`)   |                                                        |
| `search`    | ні             | trim; порожнє не слати / ігнорувати                    |
| `konkName`  | ні             | точна назва конкурента як у `GET /skus`; порожнє = усі |
| `prodName`  | ні             | точна назва виробника; порожнє = усі                   |
| `skuIds`    | **заборонено** | якщо прийшли разом з `selectAll` → **400**             |

Resolve: той самий фільтр/індекс, що список каталогу `GET /skus?search&konkName&prodName` **без** page/limit (усі matches). Порядок стабільний (як default sort каталогу).

### Валідація (XOR)

- Рівно один режим: (`selectAll === true` без `skuIds`) **XOR** (непорожній `skuIds` без `selectAll`).
- Інакше → **400** з зрозумілим message.
- Після resolve 0 SKU → job `failed` (як зараз при порожньому resolve), не тихий empty xlsx.

## Pie

`POST /api/sku-chart-reports/selection/skus-pie`

Body:

- Режим A: `{ skuIds, dateFrom, dateTo }` — `skuIds ≥ 1`, **без upper bound**.
- Режим B: `{ selectAll: true, search?, konkName?, prodName?, dateFrom, dateTo }` — без `skuIds`.

Ті самі XOR / 0 matches → **404** (як зараз, якщо жоден SKU не знайдено).

Відповідь без зміни форми: `data[skuId]` + `all`.

## Імплементація (орієнтир)

1. Винести shared helper `resolveSelectionSkus(params)`:
   - якщо `selectAll` → query SKU як catalog filters, повернути `_id[]` (+ потрібні поля для builder);
   - інакше → існуючий `resolveSkusByIds(skuIds)` **без** `.slice(0, 100)`.
2. Прибрати Zod/ліміти `max(100)` / `1..100` у selection stock/sales/pie.
3. Worker builders (`sku-selection-stock` / `sku-selection-sales`) лишаються; міняється лише джерело id.
4. Оновити **бекенд** docs: `excel-jobs`, `sku-excel-reports`, `sku-chart-reports`, access/matrix якщо згадує ліміт 100.
5. Тести: manual 101+ ids; selectAll з фільтром; XOR 400; empty resolve.

## Не робити

- Не змішувати з `sku-konk-*` / `sku-skugr-*`.
- Не вводити новий kind — тільки розширити params існуючих.
- Не лишати hard-cap «для захисту» без узгодження з продуктом (фронт свідомо зняв ліміт; при потребі окремий rate-limit/timeout job, не обрізка вибірки).
