# Sync: bootstrap sku-successor reference

- **Date:** 2026-11-06
- **Commit:** 04e88348d9c822ee109d84dca9b0a37cbf3ca76d (baseline HEAD at reference creation; branch `dev-banal`)
- **PR (optional):** —

## Summary

Создана папка `docs/sku-successor/` как первичный референс для отдельного SKU-проекта: principles, domain map, frozen models, crons/cutover, capabilities, target layout, legacy pointers, процесс sync. Runtime `src/` не менялся.

## Impact

| Area                          | Changed? | Notes                                               |
| ----------------------------- | -------- | --------------------------------------------------- |
| Frozen Mongo schema           | no       | зафиксирован снимок текущих схем в FROZEN_MODELS.md |
| Domain invariant              | no       | задокументированы существующие                      |
| Capability / product behavior | no       | снимок capabilities                                 |
| Cron / writer / schedule      | no       | снимок расписаний                                   |
| Auth / roles for SKU          | no       | v1 = как в старом                                   |
| Docs only (modules/api)       | yes      | новая папка docs/sku-successor + cursor rule        |

## Updates required in sku-successor docs

- [x] FROZEN_MODELS.md
- [x] CAPABILITIES.md
- [x] CRONS_AND_CUTOVER.md
- [x] DOMAIN_MAP.md / TARGET_LAYOUT.md / PRINCIPLES.md
- [ ] none

## Implied work for successor repo

- Scaffold репо по TARGET_LAYOUT.md (TanStack Start + worker, ENABLE_CRONS=false).
- Скопировать mongoose-контракт из FROZEN_MODELS в packages/db.
- Auth v1 как в docs/modules/auth.md.
- Не активировать writers/cron на продовых SKU-коллекциях до дня Д.
- Excel — проектировать с нуля; не писать в продовую `exceljobs`.

## Links

- Legacy module/api docs touched: — (только новая docs/sku-successor)
- Source paths: docs/sku-successor/**, .cursor/rules/sku-successor-sync.mdc
