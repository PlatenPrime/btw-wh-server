# Cron и день Д

Timezone по умолчанию **Europe/Kyiv** (у btrade в коде указано `Europe/Kiev` — то же смещение).

До дня Д schedule активен **только** в `btw-wh-server`. В successor: код worker можно писать, `ENABLE_CRONS=false`.

## SKU-периметр (переезжают на день Д)

| Job                     | Cron expr                       | Что делает                                                               | Пишет в                                                                                      | Source                                                                                                                            |
| ----------------------- | ------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Sku slices              | `0 0 20 * * *` ежедневно 20:00  | Срез stock/price по konkName; post-pass (pack-flip, manufacturer rollup) | `sku_slice_months`, `sku_slice_day_metas`, `sku_manufacturer_day_sales`, побочно Sku.artikul | [startSkuSlicesCron.ts](../../src/modules/sku-slices/cron/startSkuSlicesCron.ts)                                                  |
| Compensating SKU slices | `0 30 10 * * *` ежедневно 10:30 | Повторный опрос недостоверных точек Sku                                  | `sku_slice_months` (+ related)                                                               | [startCompensatingSlicesCron.ts](../../src/modules/slice-compensation/cron/startCompensatingSlicesCron.ts) — **только SKU-ветка** |
| Fill Skugr SKUs         | `0 0 22 * * 0` вс 22:00         | Refill состава групп из листингов                                        | `skus`, `skugrs.skus`                                                                        | [startFillSkugrSkusCron.ts](../../src/modules/skugrs/cron/startFillSkugrSkusCron.ts)                                              |
| Sku invalid flag        | `0 0 14 * * 0` вс 14:00         | Пересчёт `Sku.isInvalid` по 7 дням `-1/-1`                               | `skus.isInvalid`                                                                             | [startSkuInvalidFlagCron.ts](../../src/modules/skus/cron/startSkuInvalidFlagCron.ts)                                              |
| Btrade slices           | `0 0 0 * * *` ежедневно 00:00   | Срез Btrade quantity/price                                               | `btrade_slice_months`, `btrade_manufacturer_day_sales`                                       | [startBtradeSlicesCron.ts](../../src/modules/btrade-slices/cron/startBtradeSlicesCron.ts)                                         |
| Grabo SKU sync          | `0 0 4 * * 6` сб 04:00          | Полный срез каталога Grabo                                               | `graboskus`                                                                                  | [startGraboSkuSyncCron.ts](../../src/modules/grabo-skus/cron/startGraboSkuSyncCron.ts)                                            |

Ключ дня ночного sku-slice: следующий календарный день Kyiv (`toNextKyivSliceDate`), не «сегодня» wall-clock — см. комментарий в sku-slices cron.

## Остаётся в складском процессе после дня Д

| Job                                             | Примечание                                                                                                               |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Compensating **analog** slices                  | Та же cron-функция сейчас гоняет analog+sku parallel; после split SKU-compensation уходит в successor, analog — в старый |
| Analog slices cron                              | Вне периметра                                                                                                            |
| Deficit report, pos nameukr, collections backup | Склад / инфра                                                                                                            |

## Dual-run: один writer

| Коллекция                                                     | Writer до дня Д                                       |
| ------------------------------------------------------------- | ----------------------------------------------------- |
| `skus`, `skugrs`, `sku_slice_*`, `sku_manufacturer_day_sales` | btw-wh-server                                         |
| `btrade_slice_*`, `btrade_manufacturer_day_sales`             | btw-wh-server                                         |
| `graboskus`                                                   | btw-wh-server                                         |
| `konks`, `prods`                                              | btw-wh-server (prods shared — schema sync only)       |
| `users`, `roles`                                              | btw-wh-server (successor читает тот же issuer/secret) |
| `exceljobs`                                                   | только старый worker; successor не пишет в прод       |

Successor до дня Д может читать Mongo и отдавать UI/RPC. Мутации каталога (ручной CRUD), если включены в новом UI до cutover, требуют явного соглашения «кто writer» — иначе два клиента на одну карточку. Безопасный default: до дня Д мутации и cron только через старый проект.

## Окно cutover (день Д)

Целевое окно: **после завершения ночного sku-slice (и его post-pass)** и **до следующего 20:00 Kyiv** (и желательно вне 10:30 compensation / 00:00 btrade / weekly jobs).

Порядок:

1. Убедиться, что ночной sku-slice и materialize завершены; нет running excel/sku jobs, критичных для cutover.
2. Остановить SKU-периметровые cron в `btw-wh-server` (и SKU-ветку compensation; analog compensation оставить).
3. Включить `ENABLE_CRONS` (или аналог) в successor worker.
4. Переключить фронт/DNS на successor; chrome-extensions (Air) — на новый origin.
5. Позже: выпил SKU-модулей из Express и старого React (отдельный PR).

Откат: выключить cron successor, вернуть schedule старому, фронт назад. Данные в Mongo общие — откат схемы не нужен, если не мигрировали поля.

## Client-side ingest (не cron, но writer)

Air client fill / slice ingest (chrome extension → API) до дня Д пишет через старый API. На cutover переключить base URL на successor authenticated routes. До переключения — один writer path.
