# API срезов SKU (Sku Slices)

Сырые ежедневные срезы остатков и цен по SKU конкурентов. Отчёты (продажи, Excel, графики) — в модулях [sku-sales-reports](sku-sales-reports.md), [sku-excel-reports](sku-excel-reports.md), [sku-chart-reports](sku-chart-reports.md). Миграция путей: [sku-api-migration](sku-api-migration.md).

Доступ: checkAuth + checkRoles(ADMIN).

## Эндпоинты

### GET `/api/sku-slices`

**410 Gone.** Legacy дамп дневного Mixed снят. Мониторинг:

- `GET /api/sku-slices/day-status`
- `GET /api/sku-slices/day-invalid`

**Ответ 410:**

```text
{
  message: string,
  errors: Array<{
    code: "SKU_SLICE_DAY_LIST_GONE",
    dayStatus: string,
    dayInvalid: string
  }>
}
```

---

### GET `/api/sku-slices/day-status`

Статус дневного прогона: DayMeta (rotation/stats) + счётчики точек в `sku_slice_months`.

**Query:** `konkName` (string), `date` (YYYY-MM-DD).

**Ответ 200:**

```text
{
  message: string,
  data: {
    konkName: string,
    date: Date (ISO),
    rotationMeta: { cycleDays, dayIndex, dueCount } | null,
    stats: {
      filled: number,
      invalid: number,
      errorCount: number,
      dueTotal?: number,
      abortReason?: string
    } | null,
    pointsTotal: number,
    pointsInvalid: number,
    createdAt?: Date,
    updatedAt?: Date
  }
}
```

**Ошибки:** 400, 401, 403, 500.

---

### GET `/api/sku-slices/day-invalid`

Пагинация invalid точек дня из months + join Sku (замена `isInvalid=true` на старом GET `/`).

**Query:** `konkName`, `date` (YYYY-MM-DD), `page` (default 1), `limit` (default 10, max 100).

**Ответ 200:**

```text
{
  message: string,
  data: {
    konkName: string,
    date: Date (ISO),
    items: Array<{
      productId: string,
      stock: number,
      price: number,
      sku: Sku | null
    }>
  },
  pagination: { page, limit, total, totalPages, hasNext, hasPrev }
}
```

**Ошибки:** 400, 401, 403, 500.

---

### GET `/api/sku-slices/client/air/pending`

Очередь Air SKU для клиентского дозаполнения сегодняшнего среза (календарный день `Europe/Kiev`). В выборку попадают только SKU из групп `Skugr` с `isSliced: true`. Позиция pending, если в `SkuSliceMonth` за сегодня нет ключа дня или `stock === -1` / `price === -1`.

**Ответ 200:**

```text
{
  message: string,
  data: {
    date: Date (ISO),
    items: Array<{
      skuId: string,
      productId: string,
      title: string,
      url: string
    }>
  }
}
```

**Ошибки:** 401, 403, 500.

---

### PUT `/api/sku-slices/client/air/sku/:skuId`

Идемпотентная запись точки сегодняшнего Air в `SkuSliceMonth` из HTML first-party страницы товара. Backend парсит HTML тем же контрактом, что `readAirProductFromHtml`. Канал параллелен серверному scrape: сервер к сайту Air при этом PUT не ходит.

**Path:** `skuId` — валидный ObjectId.

**Body:**

- `sourceUrl` (string, URL) — должен совпадать с `Sku.url` (нормализация: без hash, без завершающего `/` у path)
- `html` (string, 1…2_000_000 символов) — `outerHTML` страницы товара

**Ответ 200:**

```text
{
  message: string,
  data: {
    status: "saved" | "skipped",
    date: Date (ISO),
    productId: string,
    stock: number,
    price: number
  }
}
```

`saved` — ключ отсутствовал или содержал `-1`; `skipped` — валидное значение уже есть, перезаписи нет.

**Ошибки:** 400 (валидация / не air / не sliced / URL mismatch), 401, 403, 404 (sku не найден), 422 (HTML без валидных stock/price), 500.

---

### GET `/api/sku-slices/sku/:skuId`

Одна точка остатка и цены по SKU на дату (значения из БД, без нормализации для отчётов).

**Path:** `skuId` — валидный ObjectId.

**Query:** `date` (YYYY-MM-DD, обязательно).

**Ответ 200:** `{ message: string, data: { stock: number, price: number } }`.

**Ошибки:** 400, 401, 403, 404, 500.

---

### PATCH `/api/sku-slices/sku/:skuId`

Ручная запись `stock`/`price` SKU в `SkuSliceMonth`. Режим XOR: либо одна дата `date`, либо диапазон `dateFrom`+`dateTo`, либо массив периодов `periods` (не вместе). Точка дня `days[YYYY-MM-DD]` создаётся или перезаписывается (upsert month-дока при необходимости). `0` и `-1` допустимы. Диапазон / каждый период: `dateFrom` ≤ `dateTo`, максимум 366 календарных дней; для `periods` — суммарно уникальных дней ≤ 366. Пересечения периодов допустимы (дни дедуплицируются).

**Path:** `skuId` — валидный ObjectId.

**Body (один день):**

- `date` (string, YYYY-MM-DD, обязательно)
- `stock` (number, finite, обязательно)
- `price` (number, finite, обязательно)

**Body (диапазон):**

- `dateFrom` (string, YYYY-MM-DD, обязательно)
- `dateTo` (string, YYYY-MM-DD, обязательно)
- `stock` (number, finite, обязательно)
- `price` (number, finite, обязательно)

**Body (массив периодов):**

- `periods` (array, min 1, обязательно) — элементы `{ dateFrom, dateTo }` (YYYY-MM-DD)
- `stock` (number, finite, обязательно)
- `price` (number, finite, обязательно)

**Ответ 200 (один день):**

```text
{
  message: string,
  data: {
    productId: string,
    date: Date (ISO),
    stock: number,
    price: number,
    previous: { stock: number, price: number } | null,
    created: boolean
  }
}
```

`previous` — прежняя точка, если ключ дня уже был; `null`, если точка создана. `created` — `true`, если точка дня создана этим запросом.

**Ответ 200 (диапазон):**

```text
{
  message: string,
  data: {
    productId: string,
    stock: number,
    price: number,
    dateFrom: Date (ISO),
    dateTo: Date (ISO),
    updatedCount: number,
    days: Array<{
      date: Date (ISO),
      previous: { stock: number, price: number } | null,
      created: boolean
    }>
  }
}
```

**Ответ 200 (массив периодов):**

```text
{
  message: string,
  data: {
    productId: string,
    stock: number,
    price: number,
    periods: Array<{ dateFrom: Date (ISO), dateTo: Date (ISO) }>,
    updatedCount: number,
    days: Array<{
      date: Date (ISO),
      previous: { stock: number, price: number } | null,
      created: boolean
    }>
  }
}
```

`updatedCount` / `days` — по уникальным дням после дедупликации пересечений.

**Ошибки:** 400, 401, 403, 404 (нет SKU / нет productId), 500.

---

### POST `/api/sku-slices/skugr/:skugrId/run-today`

**410** `API_TASKS_MIGRATED`, kind `sku-slices.skugr-run-today`. Запуск: [apitasks](apitasks.md). Params: `{ skugrId }`.

---

### GET `/api/sku-slices/sku/:skuId/range`

Плотный массив точек среза по SKU за период: по каждому UTC-дню от `dateFrom` до `dateTo` включительно. Пропуски ключа в `data`, а также `-1` в stock/price заполняются forward-fill из последнего валидного значения (warm-start — день до `dateFrom`). До первого валидного среза в периоде — `stock: 0`, `price: 0`. Расчёт продаж не выполняется (см. sales-range).

**Path:** `skuId` — валидный ObjectId.

**Query:** `dateFrom`, `dateTo` (YYYY-MM-DD, обязательно), `dateFrom` ≤ `dateTo`.

**Ответ 200:** `{ message: string, data: Array<{ date: string (ISO), stock: number, price: number }> }` — длина массива = число календарных дней в диапазоне.

**Ошибки:** 400, 401, 403, 404, 500.

---

### GET `/api/sku-slices/pack-flips`

Проверка кратных инверсий `stock`/`price` по конкуренту за период. Срезы не изменяются. Детектор общий для конкурентов; auto-apply после ночного cron — только konk из конфига `packFlipAutoApplyKonks`.

**Query:**

- `konkName` (string, обязательно) — нормализуется (trim + lowercase)
- `dateFrom`, `dateTo` (YYYY-MM-DD, обязательно), `dateFrom` ≤ `dateTo`

**Ответ 200:**

```text
{
  message: string,
  data: {
    konkName: string,
    dates: string[],
    patched: Array<{
      productId: string,
      skuId: string,
      title: string,
      url: string,
      imageUrl: string,
      kind: "inverse",
      date: string,
      neighborDate: string,
      factor: number,
      from: { stock: number, price: number },
      patched?: { stock: number, price: number }
    }>,
    priceOnly: Array<{
      productId: string,
      skuId: string,
      title: string,
      url: string,
      imageUrl: string,
      kind: "price-only",
      date: string,
      neighborDate: string,
      factor: number,
      from: { stock: number, price: number }
    }>,
    ambiguous: Array<{
      productId: string,
      skuId: string,
      title: string,
      url: string,
      imageUrl: string,
      kind: "ambiguous",
      date: string,
      neighborDate: string,
      factor: number,
      from: { stock: number, price: number }
    }>
  }
}
```

`dates` — UTC YYYY-MM-DD, inclusive. Пустые массивы findings — скачков нет, не ошибка. Поле `patched` у finding — предлагаемый рескейл, не записан. `skuId` — Mongo `_id` документа Sku (пустая строка, если Sku нет). `imageUrl` — из документа Sku. `url` — страница конкурента.

**Ошибки:** 400, 401, 403, 500.

---

### POST `/api/sku-slices/post-corrections/run`

Постановка фоновой задачи post-pass коррекций за календарный диапазон (balun/svbum fake stock, pack-flip auto-apply konks, manufacturer rollup). Синхронно не выполняет коррекцию — создаёт ApiTask `sku-slices.post-corrections.run`; статус и результат — через [apitasks](apitasks.md).

**Тело:**

| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| dateFrom | string | да | YYYY-MM-DD, UTC-сутки, inclusive |
| dateTo | string | да | YYYY-MM-DD, inclusive, не раньше dateFrom; диапазон ≤ 31 день |
| apply | boolean | нет, default false | true — запись в SkuSliceMonth и rollup; false — dry-run |

**Ответ 202:** как `POST /api/apitasks` (`message`, `data.taskId`, `data.kind`, `data.status`, `data.pollIntervalMs`, …).

**Ошибки:** 400 валидация; 401; 403; 409 параллельная задача на тот же диапазон; 429 лимит активных задач пользователя; 500.
