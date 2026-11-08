# Frozen Mongo models

Контракт документов и индексов. Источник — Mongoose-схемы в `btw-wh-server` на момент bootstrap sync. При изменении схемы в этом репо — обновить этот файл и положить дельту в `sync/`.

Timestamps `createdAt` / `updatedAt` — везде, где в схеме `{ timestamps: true }`.

---

## Sku → коллекция `skus`

Source: [src/modules/skus/models/Sku.ts](../../src/modules/skus/models/Sku.ts)

| Поле         | Тип     | Ограничения                                        |
| ------------ | ------- | -------------------------------------------------- |
| konkName     | string  | required                                           |
| prodName     | string  | required                                           |
| productId    | string  | required, **unique** — канон `{konkLower}-{rawId}` |
| artikul      | string  | default `""`                                       |
| btradeAnalog | string  | default `""`                                       |
| title        | string  | required                                           |
| url          | string  | required, **unique**                               |
| imageUrl     | string  | default `""`                                       |
| isInvalid    | boolean | default `false`                                    |

Индексы: unique `productId`, unique `url`, `{ konkName: 1, isInvalid: 1 }`.

---

## Skugr → коллекция `skugrs`

Source: [src/modules/skugrs/models/Skugr.ts](../../src/modules/skugrs/models/Skugr.ts)

| Поле     | Тип        | Ограничения                |
| -------- | ---------- | -------------------------- |
| konkName | string     | required                   |
| prodName | string     | required                   |
| title    | string     | required                   |
| url      | string     | required                   |
| isSliced | boolean    | required, default `true`   |
| skus     | ObjectId[] | ref Sku, элементы required |

Индексы: `{ konkName: 1, prodName: 1 }`.

---

## Konk → коллекция `konks`

Source: [src/modules/konks/models/Konk.ts](../../src/modules/konks/models/Konk.ts)

| Поле        | Тип      | Ограничения                            |
| ----------- | -------- | -------------------------------------- |
| name        | string   | required, **unique** (ключ конкурента) |
| title       | string   | required                               |
| url         | string   | required                               |
| imageUrl    | string   | required                               |
| recountDays | string[] | required, default `[]`                 |

---

## Prod → коллекция `prods` (shared со складом)

Source: [src/modules/prods/models/Prod.ts](../../src/modules/prods/models/Prod.ts)

Любое изменение схемы — **сразу** в складском проекте, successor и этом файле.

| Поле     | Тип    | Ограничения          |
| -------- | ------ | -------------------- |
| name     | string | required, **unique** |
| title    | string | required             |
| imageUrl | string | required             |

---

## SkuSliceMonth → коллекция `sku_slice_months`

Source: [src/modules/sku-slices/models/SkuSliceMonth.ts](../../src/modules/sku-slices/models/SkuSliceMonth.ts)

Source of truth точек stock/price.

| Поле      | Тип          | Ограничения                                                                         |
| --------- | ------------ | ----------------------------------------------------------------------------------- |
| konkName  | string       | required                                                                            |
| productId | string       | required                                                                            |
| month     | Date         | required — UTC midnight первого дня месяца                                          |
| days      | Mixed object | default `{}`; ключи `YYYY-MM-DD` → `{ stock: number, price: number }` (в т.ч. `-1`) |

Индексы: unique `{ konkName: 1, productId: 1, month: 1 }`, `{ konkName: 1, month: 1 }`.

Тип точки: [skuSliceTypes.ts](../../src/modules/sku-slices/models/skuSliceTypes.ts) — `ISkuSliceDataItem`.

---

## SkuSliceDayMeta → коллекция `sku_slice_day_metas`

Source: [src/modules/sku-slices/models/SkuSliceDayMeta.ts](../../src/modules/sku-slices/models/SkuSliceDayMeta.ts)

Observability дневного прогона (без точек stock/price).

| Поле         | Тип             | Ограничения                                          |
| ------------ | --------------- | ---------------------------------------------------- |
| konkName     | string          | required                                             |
| date         | Date            | required                                             |
| rotationMeta | subdoc optional | cycleDays, dayIndex, dueCount                        |
| stats        | subdoc optional | filled, invalid, errorCount, dueTotal?, abortReason? |

Индексы: unique `{ konkName: 1, date: 1 }`.

---

## SkuStockBand → коллекция `sku_stock_bands`

Source: [src/modules/sku-stock-bands/models/SkuStockBand.ts](../../src/modules/sku-stock-bands/models/SkuStockBand.ts)

| Поле      | Тип                      | Ограничения                 |
| --------- | ------------------------ | --------------------------- |
| konk      | `{ name, title }` subdoc | required; name lowercase    |
| stockMin  | number                   | required, ≥ 0; ≤ stockMax   |
| stockMax  | number                   | required, ≥ 0               |
| normalMax | number                   | required, ≥ 0; `< stockMin` |

Индексы: `{ "konk.name": 1 }`. Несколько документов на один konk допустимы.

---

## SkuSlice → коллекция `sku_slices` (legacy)

Source: [src/modules/sku-slices/models/SkuSlice.ts](../../src/modules/sku-slices/models/SkuSlice.ts)

Runtime stock/price **не пишет**. Только migrate/verify CLI.

| Поле         | Тип      | Ограничения                            |
| ------------ | -------- | -------------------------------------- |
| konkName     | string   | required                               |
| date         | Date     | required                               |
| data         | Mixed    | default `{}` — productId → stock/price |
| rotationMeta | optional | cycleDays, dayIndex, dueCount          |

Индексы: unique `{ konkName: 1, date: 1 }`.

---

## SkuManufacturerDaySales → коллекция `sku_manufacturer_day_sales`

Source: [src/modules/sku-reporting/models/SkuManufacturerDaySales.ts](../../src/modules/sku-reporting/models/SkuManufacturerDaySales.ts)

| Поле     | Тип    | Ограничения          |
| -------- | ------ | -------------------- |
| konkName | string | required             |
| date     | Date   | required             |
| prodName | string | required — Prod.name |
| salesPcs | number | required, default 0  |
| salesUah | number | required, default 0  |

Индексы: unique `{ konkName: 1, date: 1, prodName: 1 }`.

---

## BtradeSliceMonth → коллекция `btrade_slice_months`

Source: [src/modules/btrade-slices/models/BtradeSliceMonth.ts](../../src/modules/btrade-slices/models/BtradeSliceMonth.ts)

| Поле    | Тип    | Ограничения                                                            |
| ------- | ------ | ---------------------------------------------------------------------- |
| artikul | string | required                                                               |
| month   | Date   | required — UTC midnight первого дня месяца                             |
| days    | Mixed  | default `{}`; ключи `YYYY-MM-DD` → `{ price, quantity }` (в т.ч. `-1`) |

Индексы: unique `{ artikul: 1, month: 1 }`, `{ month: 1 }`.

Тип точки: [btradeSliceTypes.ts](../../src/modules/btrade-slices/models/btradeSliceTypes.ts).

---

## BtradeSlice → коллекция `btrade_slices` (legacy)

Source: [src/modules/btrade-slices/models/BtradeSlice.ts](../../src/modules/btrade-slices/models/BtradeSlice.ts)

| Поле | Тип   | Ограничения                             |
| ---- | ----- | --------------------------------------- |
| date | Date  | required, **unique**                    |
| data | Mixed | default `{}` — artikul → quantity/price |

---

## BtradeManufacturerDaySales → коллекция `btrade_manufacturer_day_sales`

Source: [src/modules/sku-reporting/models/BtradeManufacturerDaySales.ts](../../src/modules/sku-reporting/models/BtradeManufacturerDaySales.ts)

| Поле     | Тип    | Ограничения                                |
| -------- | ------ | ------------------------------------------ |
| date     | Date   | required                                   |
| prodName | string | required — Art.prodName trimmed+lowercased |
| salesPcs | number | required, default 0                        |
| salesUah | number | required, default 0                        |

Индексы: unique `{ date: 1, prodName: 1 }`.

---

## GraboSku → коллекция `graboskus`

Source: [src/modules/grabo-skus/models/GraboSku.ts](../../src/modules/grabo-skus/models/GraboSku.ts)

Не конкурент.

| Поле                                              | Тип      | Ограничения               |
| ------------------------------------------------- | -------- | ------------------------- |
| title                                             | string   | default `""`              |
| productId                                         | string   | required, **unique**      |
| isNewProduct                                      | boolean  | required, default `false` |
| color, size, material, gas, language, gasCapacity | string   | default `""`              |
| tags                                              | string[] | default `[]`              |
| images                                            | string[] | default `[]`              |
| url                                               | string   | required                  |
| isOnSite                                          | boolean  | required, default `true`  |
| lastSeenAt                                        | Date     | required                  |

Индексы: unique `productId`, `{ isOnSite: 1 }`, `{ url: 1 }`, `{ tags: 1 }`.

---

## User → default collection `users`

Source: [src/modules/auth/models/User.ts](../../src/modules/auth/models/User.ts)

Явного имени коллекции в схеме нет (mongoose default). Auth v1 identical.

| Поле     | Тип    | Ограничения            |
| -------- | ------ | ---------------------- |
| username | string | required, **unique**   |
| fullname | string | required               |
| password | string | required (bcrypt hash) |
| role     | string | optional, ref Role     |
| telegram | string | optional               |
| photo    | string | optional               |

---

## Role → default collection `roles`

Source: [src/modules/auth/models/Role.ts](../../src/modules/auth/models/Role.ts)

| Поле  | Тип    | Ограничения              |
| ----- | ------ | ------------------------ |
| value | string | unique, default `"USER"` |
| name  | string | optional                 |

---

## ExcelJob → коллекция `exceljobs` (референс полей)

Source: [src/modules/excel-jobs/models/ExcelJob.ts](../../src/modules/excel-jobs/models/ExcelJob.ts)

Поля текущего пайплайна. **Новый excel в successor — с нуля.** До дня Д не писать в продовую `exceljobs` (конфликт со старым worker): отдельная коллекция на staging/dev или jobs только после cutover.

| Поле                      | Тип    | Ограничения                                                            |
| ------------------------- | ------ | ---------------------------------------------------------------------- |
| userId                    | string | required, indexed                                                      |
| kind                      | string | required                                                               |
| params                    | Mixed  | default `{}`                                                           |
| status                    | enum   | queued/running/ready/failed/cancelled/expired; default queued; indexed |
| phase                     | enum   | queued/loading/building/finalizing; default queued                     |
| progress                  | number | 0..100, default 0                                                      |
| fileName, filePath, error | string | optional                                                               |
| sizeBytes                 | number | optional                                                               |
| expiresAt                 | Date   | required; TTL index expireAfterSeconds 0                               |

Индексы: `{ userId: 1, status: 1 }`, TTL на `expiresAt`.

SKU-релевантные kind ids в legacy (референс поведения, не контракт БД): `sku-catalog-new-since`, `sku-catalog-invalid`, `sku-konk-stock`, `sku-konk-sales`, `sku-skugr-stock`, `sku-skugr-sales`, `sku-skugr-skus-share`, `sku-one-stock`, `sku-one-sales`, `sku-selection-stock`, `sku-selection-sales`, `grabo-skus`. Analog/konk-btrade excel kinds на базе Analog удалены (2026-11-07).

---

## Доменные инварианты (не поля схемы, но священны)

- Канон `Sku.productId`: `{konkNameLower}-{rawId}`.
- Unique `Sku.url` глобально.
- `prodName: newsku` — временный производитель новинок.
- `isInvalid`: true, если 7 подряд календарных дней среза с `stock === -1` и `price === -1` (см. крон SkuInvalid).
- Ключ дня среза SKU — семантика Kyiv / `toNextKyivSliceDate` у ночного cron (см. sku-slices cron).
- Значения `-1` в точках среза = недостоверно / нет данных.
