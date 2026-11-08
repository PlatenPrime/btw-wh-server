# Sync: Sku stock bands

- **Date:** 2026-11-08
- **Commit:** pending
- **PR (optional):** —

## Summary

Добавлена коллекция сохранённых диапазонов аномального остатка (`SkuStockBand`) с CRUD, discover по `bandId` и batch RTL-correct через ApiTask `sku-slices.stock-band.batch-correct` с параметром `normalMax`. Старый ручной band-spike API не изменён.

## Impact

| Area                          | Changed? | Notes                                       |
| ----------------------------- | -------- | ------------------------------------------- |
| Frozen Mongo schema           | yes      | `sku_stock_bands` / SkuStockBand            |
| Domain invariant              | yes      | sandwich через optional normalMax           |
| Capability / product behavior | yes      | CRUD bands + batch correct                  |
| Cron / writer / schedule      | no       |                                             |
| Auth / roles for SKU          | no       | ADMIN как у band-spike                      |
| Docs only (modules/api)       | yes      | api/modules/frontend/apitasks/access-matrix |

## Updates required in sku-successor docs

- [x] FROZEN_MODELS.md
- [x] CAPABILITIES.md
- [ ] CRONS_AND_CUTOVER.md
- [ ] DOMAIN_MAP.md / TARGET_LAYOUT.md / PRINCIPLES.md
- [ ] none

## Implied work for successor repo

Перенести сущность stock band + UX список/карточка диапазона и batch ApiTask; сохранить dual-path со старым ручным discover.

## Links

- Legacy module/api docs touched: `docs/modules/sku-stock-bands.md`, `docs/api/sku-stock-bands.md`, `docs/frontend/sku-stock-bands.md`, `docs/api/sku-slices.md`, `docs/api/apitasks.md`, `docs/api/access-matrix.md`
- Source paths: `src/modules/sku-stock-bands/`, `src/modules/sku-slices/controllers/discover-stock-band/`, `src/modules/sku-slices/controllers/batch-correct-stock-band/`
