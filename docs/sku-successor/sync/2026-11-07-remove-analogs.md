# Sync: Remove analogs domain

- **Date:** 2026-11-07
- **Commit:** (pending)
- **PR (optional):** —

## Summary

Из `btw-wh-server` полностью убирается продуктовый домен Analogs: модули `analogs` / `analog-slices`, HTTP API, analog excel kinds, analog-ветка compensating cron. Primary analog-slices cron уже был отключён; теперь удаляется и код, и compensation. Successor **не** должен реализовывать analogs.

## Impact

| Area                          | Changed? | Notes                                                                    |
| ----------------------------- | -------- | ------------------------------------------------------------------------ |
| Frozen Mongo schema           | no       | коллекции `analogs` / `analog_slices` вне SKU frozen; drop вручную позже |
| Domain invariant              | yes      | analogs больше не часть складского «хвоста» после cutover                |
| Capability / product behavior | yes      | CAPABILITIES: analogs removed, not deferred                              |
| Cron / writer / schedule      | yes      | compensating cron — только SKU                                           |
| Auth / roles for SKU          | no       |                                                                          |
| Docs only (modules/api)       | yes      | modules/api analogs* удаляются / чистятся                                |

## Updates required in sku-successor docs

- [x] FROZEN_MODELS.md — no (SKU models unchanged; `Sku.btradeAnalog` stays)
- [x] CAPABILITIES.md
- [x] CRONS_AND_CUTOVER.md
- [x] DOMAIN_MAP.md / TARGET_LAYOUT.md / PRINCIPLES.md
- [ ] none

## Implied work for successor repo

- Не проектировать Analog / AnalogSlice / analog excel comparison / analog compensation.
- Сравнения конкурент↔Btrade строить только на SKU/sku-slices (+ btrade-slices).
- Не оставлять «analog остаётся в warehouse» в cutover-плане.

## Links

- Legacy module/api docs touched: `docs/modules|api/analogs*.md`, `analog-slices*.md`, slices, browser, excel-jobs, access-matrix, README
- Source paths: `src/modules/analogs`, `src/modules/analog-slices`, `src/modules/slice-compensation`, `src/modules/excel-jobs`
