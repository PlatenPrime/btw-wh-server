# Указатели на legacy (btw-wh-server)

Successor не дублирует полный REST API. Ниже — где смотреть текущую реализацию и человеческую документацию.

## Документация модулей

| Тема                           | Файл                                                                   |
| ------------------------------ | ---------------------------------------------------------------------- |
| Sku                            | [docs/modules/skus.md](../modules/skus.md)                             |
| Skugr                          | [docs/modules/skugrs.md](../modules/skugrs.md)                         |
| Konk                           | [docs/modules/konks.md](../modules/konks.md)                           |
| Prod                           | [docs/modules/prods.md](../modules/prods.md)                           |
| Sku slices                     | [docs/modules/sku-slices.md](../modules/sku-slices.md)                 |
| Sku reporting (shared)         | [docs/modules/sku-reporting.md](../modules/sku-reporting.md)           |
| Sku sales JSON                 | [docs/modules/sku-sales-reports.md](../modules/sku-sales-reports.md)   |
| Sku charts JSON                | [docs/modules/sku-chart-reports.md](../modules/sku-chart-reports.md)   |
| Sku excel (legacy paths / 410) | [docs/modules/sku-excel-reports.md](../modules/sku-excel-reports.md)   |
| Excel jobs                     | [docs/modules/excel-jobs.md](../modules/excel-jobs.md)                 |
| Btrade slices                  | [docs/modules/btrade-slices.md](../modules/btrade-slices.md)           |
| Grabo                          | [docs/modules/grabo-skus.md](../modules/grabo-skus.md)                 |
| Browser / scrapers             | [docs/modules/browser.md](../modules/browser.md)                       |
| Slices shared config           | [docs/modules/slices.md](../modules/slices.md)                         |
| Slice compensation             | [docs/modules/slice-compensation.md](../modules/slice-compensation.md) |
| Auth                           | [docs/modules/auth.md](../modules/auth.md)                             |

## API (текущий контракт склада/SKU UI)

| Тема                   | Файл                                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| Skus                   | [docs/api/skus.md](../api/skus.md)                                                                   |
| Skugrs                 | [docs/api/skugrs.md](../api/skugrs.md)                                                               |
| Sku slices             | [docs/api/sku-slices.md](../api/sku-slices.md)                                                       |
| Sku sales              | [docs/api/sku-sales-reports.md](../api/sku-sales-reports.md)                                         |
| Sku charts             | [docs/api/sku-chart-reports.md](../api/sku-chart-reports.md)                                         |
| Sku excel              | [docs/api/sku-excel-reports.md](../api/sku-excel-reports.md)                                         |
| Excel jobs             | [docs/api/excel-jobs.md](../api/excel-jobs.md), [excel-jobs-frontend](../api/excel-jobs-frontend.md) |
| Path migration history | [docs/api/sku-api-migration.md](../api/sku-api-migration.md)                                         |
| Access matrix          | [docs/api/access-matrix.md](../api/access-matrix.md)                                                 |
| Grabo                  | [docs/api/grabo-skus.md](../api/grabo-skus.md)                                                       |
| Btrade slices          | [docs/api/btrade-slices.md](../api/btrade-slices.md)                                                 |
| Browser                | [docs/api/browser.md](../api/browser.md)                                                             |
| Auth                   | [docs/api/auth.md](../api/auth.md)                                                                   |

## Исходники моделей

См. таблицу в [FROZEN_MODELS.md](./FROZEN_MODELS.md).

## Исходники cron

См. [CRONS_AND_CUTOVER.md](./CRONS_AND_CUTOVER.md).

## Browser competitor dirs (legacy)

`src/modules/browser/{air,balun,yumi,yumin,sharte,perfect,svbum,dojdevik,sharik,promua}/` + `src/modules/browser/utils/`.

Sharik — транспорт/остатки Btrade-стороны; в successor btrade — peer под `competitors/btrade`.
