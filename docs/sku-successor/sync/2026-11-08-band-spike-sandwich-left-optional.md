# Sync: Band-spike sandwich + left-optional RTL

- **Date:** 2026-11-08
- **Commit:** (pending)
- **PR (optional):** —

## Summary

Stock-band discover фильтрует кандидатов sandwich’ем через `normalMax` (right обязателен, left только если день с данными есть). RTL correct (legacy band-spike и batch) больше не скипует `missing-left` при валидном правом якоре — патч от right до первого дня in-band run в окне.

## Impact

| Area                          | Changed? | Notes                                    |
| ----------------------------- | -------- | ---------------------------------------- |
| Frozen Mongo schema           | no       |                                          |
| Domain invariant              | yes      | sandwich left optional when stock absent |
| Capability / product behavior | yes      | discover + correct                       |
| Cron / writer / schedule      | no       |                                          |
| Auth / roles for SKU          | no       |                                          |
| Docs only (modules/api)       | no       | docs обновлены вместе с кодом            |

## Updates required in sku-successor docs

- [ ] FROZEN_MODELS.md
- [x] CAPABILITIES.md
- [ ] CRONS_AND_CUTOVER.md
- [ ] DOMAIN_MAP.md / TARGET_LAYOUT.md / PRINCIPLES.md
- [ ] none

## Implied work for successor repo

Сохранить ту же семантику: stock-band discover = sandwich(`normalMax`); RTL correct допускает отсутствующий left при валидном right.

## Links

- Legacy module/api docs touched: `docs/api/sku-slices.md`, `docs/modules/sku-slices.md`, `docs/modules/sku-stock-bands.md`, `docs/frontend/sku-stock-bands.md`
- Source paths: `src/modules/sku-slices/utils/computeRtlBandSpikePatches.ts`, `detectBandSpikeExits.ts`, discover-band-spike / discover-stock-band utils
