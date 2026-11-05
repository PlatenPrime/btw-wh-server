# Промпт фронту: selectAll + includeImages для SKU Excel / pie

Бекенд готовий. Підтягни контракт клієнта під params нижче. Копії docs у фронт-репо оновлюй за потреби з цього файлу.

## 1. Selection: знято ліміт 100 + `selectAll`

Kinds / endpoints:

- Excel: `sku-selection-stock`, `sku-selection-sales` через `POST /api/excel-jobs`
- Pie: `POST /api/sku-chart-reports/selection/skus-pie` (синхронний JSON, не job)

### Режим A — ручний список

`skuIds`: масив валідних Mongo ObjectId, **≥ 1, без upper bound**. Порядок = порядок у файлі / pie.

Не слати `selectAll`.

### Режим B — усі за вибіркою каталогу

`selectAll: true` + ті самі фільтри, що `GET /skus`:

| Поле        | Обовʼязково    | Примітка                      |
| ----------- | -------------- | ----------------------------- |
| `selectAll` | так (`true`)   |                               |
| `search`    | ні             | trim; порожнє не слати        |
| `konkName`  | ні             | точна назва конкурента        |
| `prodName`  | ні             | точна назва виробника         |
| `skuIds`    | **заборонено** | разом з `selectAll` → **400** |

Бекенд резолвить усі matches без page/limit, sort як каталог (`title` asc).

### XOR

Рівно один режим. Інакше **400**. Після resolve 0 SKU → excel-job `failed` / pie **404**.

Спільні для Excel: `dateFrom`, `dateTo` (`YYYY-MM-DD`); опційні `metrics` як раніше.

## 2. `includeImages` — колонка «Фото»

Бекенд **чекає** булевий флаг у `params` excel-job. **Default `false`**: без поля або `false` — колонки з картинками немає.

Kinds з флагом:

- `sku-konk-stock`, `sku-konk-sales`
- `sku-skugr-stock`, `sku-skugr-sales`
- `sku-skugr-skus-share`
- `sku-selection-stock`, `sku-selection-sales`

Не стосується: `sku-one-*`, catalog, art/analog/poses, pie.

### Breaking: `sku-skugr-skus-share`

Раніше превʼю були завжди. Тепер без `includeImages: true` колонки «Фото» не буде. Якщо UI «з фото» — завжди слати `includeImages: true`.

### UI

Чекбокс / тогл «Додати зображення товарів» → `includeImages: true|false` у `params` при `POST /api/excel-jobs`. Розмір превʼю (JPEG max edge **150×150**) фіксує бекенд — клієнту не конфігурувати.

## 3. Приклади params

Selection stock, усі за фільтром, з фото:

```json
{
  "kind": "sku-selection-stock",
  "params": {
    "selectAll": true,
    "search": "Happy Birthday",
    "konkName": "ivvo",
    "dateFrom": "2026-11-01",
    "dateTo": "2026-11-04",
    "metrics": ["stock", "price"],
    "includeImages": true
  }
}
```

Konk sales без фото (default):

```json
{
  "kind": "sku-konk-sales",
  "params": {
    "konk": "ivvo",
    "prod": "APT-SHOW",
    "dateFrom": "2026-11-01",
    "dateTo": "2026-11-04"
  }
}
```

Skugr share з фото:

```json
{
  "kind": "sku-skugr-skus-share",
  "params": {
    "skugrId": "ObjectId",
    "dateFrom": "2026-11-01",
    "dateTo": "2026-11-04",
    "includeImages": true
  }
}
```

Pie selectAll:

```json
{
  "selectAll": true,
  "konkName": "ivvo",
  "dateFrom": "2026-11-01",
  "dateTo": "2026-11-04"
}
```

## 4. Що не чіпати

- Імена kinds
- Потік excel-jobs (POST → poll → download token)
- Форму відповіді pie (`data[skuId]` + `all`)
