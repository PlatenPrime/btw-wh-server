# Breaking: Analogs removed (2026-11-07)

Бэкенд полностью убрал домен Analogs. Фронту нужно снести UI и вызовы.

## Удалено

### HTTP

- весь `/api/analogs/*`
- весь `/api/analog-slices/*`

### Excel jobs kinds

- `analog-comparison`
- `analog-sales-comparison`
- `konk-btrade-comparison`
- `konk-btrade-sales-comparison`

### Cron / compensation

- primary analog-slices cron (уже был off) — код удалён
- compensating analog slices — больше не крутится в 10:30
- `slice-compensation.run` / compensating report — только SKU (`sku` в результате, без `analog`)

## Что остаётся

- `Sku.btradeAnalog` — поле карточки SKU (связь с артикулом BTrade), **не** модуль Analog
- live stock конкурентов — `/api/skus/id/:id/stock` + `/api/browser/<konk>/stock`
- сравнения конкурент↔Btrade в UI — `/api/sku-chart-reports/*`, `/api/sku-sales-reports/*`, sku excel kinds

## Действия на фронте

1. Удалить экраны/роуты аналогов и analog-slices (CRUD, stock, range, comparison charts на старом API).
2. Убрать excel-job create с 4 analog kinds выше.
3. Не слать запросы на удалённые paths (будет 404).
4. Compensating slice UI: ожидать payload без `analog`.
