# Модуль Slice Compensation

## Описание модуля

Модуль `slice-compensation` выполняет **повторный опрос** позиций в сегодняшних точках `SkuSliceMonth`, где первичный скрапинг вернул недостоверные данные. Новые day-meta/month документы при необходимости upsert'ятся точечно — обновляется день `YYYY-MM-DD` у productId.

Домен Analog compensation удалён (2026-11-07).

## Когда позиция считается недостоверной

| Источник          | Критерий                            | Stock getter                   | Обновление                   |
| ----------------- | ----------------------------------- | ------------------------------ | ---------------------------- |
| **SkuSliceMonth** | invalid stock/price по правилам SKU | `getSkuStockDataUtil` по `_id` | если ответ не полный `-1/-1` |

Пропускаются: конкуренты из `getCompensationExcludedCompetitorSet` (union [`excludedCompetitors`](slices.md) и `compensationExcludedCompetitors`), отсутствующие Sku, неподдерживаемый konk. **Air исключён из server compensation** (и cron 10:30, и ручной POST по `konkName=air` дают пустую очередь). Дозаполнение Air SKU — только client-ingestion в [sku-slices](sku-slices.md).

## Связи

- **sku-slices** — `SkuSliceMonth` на `sliceDate = toSliceDate(new Date())`.
- **skus** — lookup сущностей и stock-утилиты (которые вызывают **browser**).
- **slices** — exclusions / `-1` семантика / throttle.

## Запись

SKU: upsert дня в `SkuSliceMonth.days.YYYY-MM-DD` — без перезаписи всего month-документа.

## Параллелизм

В cron-tick и ручном запуске обрабатывается только SKU-ветка. Внутри run позиции обрабатываются **последовательно** с jitter (как при первичном сборе SKU-срезов; диапазон зависит от `konkName` следующего item). По каждой позиции в лог пишется start/done цикла и результат refetch (`stock`, `price`, `updated`).

## Ключевые файлы

- [`cron/startCompensatingSlicesCron.ts`](../../src/modules/slice-compensation/cron/startCompensatingSlicesCron.ts);
- [`utils/runCompensatingSkuSlices.ts`](../../src/modules/slice-compensation/utils/runCompensatingSkuSlices.ts);
- [`utils/runCompensatingSlicesForKonk.ts`](../../src/modules/slice-compensation/utils/runCompensatingSlicesForKonk.ts).

## Cron

- **Задача:** refetch для `sliceDate` текущего дня; Telegram-отчёт через `cron/analytics-notifications`.
- Schedule: `0 30 10 * * *` Europe/Kiev.

## HTTP

`POST /api/slice-compensation/run` — внеочередная компенсация по `konkName` за сегодняшний `sliceDate` (только SKU). Контракт: [`docs/api/slice-compensation.md`](../api/slice-compensation.md).
