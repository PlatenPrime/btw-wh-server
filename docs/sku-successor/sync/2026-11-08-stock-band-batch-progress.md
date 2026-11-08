# Sync: Stock-band batch progress + ApiTask cancel frees queue

- **Date:** 2026-11-08
- **Commit:** (pending)
- **PR (optional):** —

## Summary

Batch stock-band correct: upsert per product с `onProgress`, один rematerialize на union дат. ApiTask cancel running сбрасывает in-process `runningId` и будит pump (ownership в `finally`), чтобы следующая задача не зависала в queued.

## Impact

| Area                          | Changed? | Notes                                 |
| ----------------------------- | -------- | ------------------------------------- |
| Frozen Mongo schema           | no       |                                       |
| Domain invariant              | yes      | rematerialize once; cancel frees slot |
| Capability / product behavior | yes      | batch progress + cancel queue         |
| Cron / writer / schedule      | no       |                                       |
| Auth / roles for SKU          | no       |                                       |
| Docs only (modules/api)       | no       | docs обновлены вместе с кодом         |

## Updates required in sku-successor docs

- [ ] FROZEN_MODELS.md
- [x] CAPABILITIES.md
- [ ] CRONS_AND_CUTOVER.md
- [ ] DOMAIN_MAP.md / TARGET_LAYOUT.md / PRINCIPLES.md
- [ ] none

## Implied work for successor repo

Сохранить: (1) один rematerialize после batch upserts; (2) cancel running освобождает runner slot без ожидания завершения старой работы.

## Links

- Legacy docs: `docs/modules/apitasks.md`, `docs/api/apitasks.md`, `docs/frontend/sku-stock-bands.md`, `docs/api/sku-slices.md`
- Source: `src/modules/apitasks/utils/apiTaskQueue.ts`, `src/modules/sku-slices/utils/correctManualBandSpikesForRangeUtil.ts`
