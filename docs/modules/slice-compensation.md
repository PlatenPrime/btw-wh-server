# Модуль Slice Compensation (Компенсирующие срезы)

## Описание модуля

Модуль `slice-compensation` выполняет **повторный опрос** позиций в сегодняшних документах `AnalogSlice` и `SkuSlice`, где первичный скрапинг вернул недостоверные данные. Новые документы срезов не создаются — обновляются отдельные ключи в поле `data` существующего документа на текущую дату.

Тип модуля: **cron + thin HTTP** — ежедневный cron и один ADMIN POST для внеочередного запуска по одному конкуренту.

## Что компенсируется

| Целевая коллекция | Условие попадания в очередь | Источник refetch | Обновление |
|-------------------|----------------------------|------------------|------------|
| **AnalogSlice** | `stock === -1 && price === -1` | `getAnalogStockDataUtil` по `_id` аналога | если ответ не полный `-1/-1` |
| **SkuSlice** | полный `-1/-1` **или** невалидная цена | `getSkuStockDataUtil` по `_id` SKU | если ответ не полный `-1/-1` |

Пропускаются: конкуренты из [`excludedCompetitors`](slices.md), отсутствующие Analog/Sku, неподдерживаемый konk.

## Связи между модулями

- **analog-slices / sku-slices** — целевые коллекции `AnalogSlice`, `SkuSlice` на `sliceDate = toSliceDate(new Date())`.
- **analogs / skus** — lookup сущностей и stock-утилиты (которые вызывают **browser**).
- **slices** — конфиг исключений и семантика `-1`.
- **sku-reporting** — jitter между запросами (`skuSliceRequestJitterMs`).

## Концепции и принятые решения

### Частичное обновление MongoDB

Каждая успешная компенсация делает `$set: { [`data.${key}`]: { stock, price } }` — без перезаписи всего документа среза.

### Параллельность и последовательность

В одном cron-tick (и в ручном запуске) analog и sku runs выполняются через `Promise.all`. Внутри каждого run позиции обрабатываются **последовательно** с jitter (как при первичном сборе SKU-срезов).

### Фильтр по конкуренту

Утилиты принимают опциональный `konkName`: cron вызывает без фильтра (все документы дня), HTTP — только выбранный конкурент. Исключения из `excludedCompetitors` по-прежнему дают пустую очередь.

### Ручной запуск и lock

Внеочередной POST держит in-memory lock на нормализованный `konkName`: повторный запуск того же конкурента, пока первый не завершился, получает отказ. Разные конкуренты могут идти параллельно. Полный пересбор среза (`run*SliceForKonkUtil`) этим эндпоинтом не выполняется.

### Ключевые файлы

- [`cron/startCompensatingSlicesCron.ts`](../../src/modules/slice-compensation/cron/startCompensatingSlicesCron.ts) — планировщик;
- [`utils/compensatingSliceRunner.ts`](../../src/modules/slice-compensation/utils/compensatingSliceRunner.ts) — построение очереди и цикл refetch;
- [`utils/runCompensatingAnalogSlices.ts`](../../src/modules/slice-compensation/utils/runCompensatingAnalogSlices.ts);
- [`utils/runCompensatingSkuSlices.ts`](../../src/modules/slice-compensation/utils/runCompensatingSkuSlices.ts);
- [`utils/runCompensatingSlicesForKonk.ts`](../../src/modules/slice-compensation/utils/runCompensatingSlicesForKonk.ts) — оркестратор ручного запуска;
- [`controllers/run-compensating-slice/`](../../src/modules/slice-compensation/controllers/run-compensating-slice/) — HTTP.

## Cron

- **Расписание:** ежедневно в **10:30 Europe/Kiev** (`0 30 10 * * *`).
- **Задача:** refetch для `sliceDate` текущего дня; parallel analog + sku; Telegram-отчёт через `cron/analytics-notifications`.

### Контекст пайплайна срезов

```
00:00  btrade-slices     → BtradeSlice
~20:00 sku-slices cron   → SkuSlice (следующий киевский день)
         analog-slices   → AnalogSlice
10:30  slice-compensation → повторный опрос -1/-1 в сегодняшних срезах
```

## HTTP

`POST /api/slice-compensation/run` — внеочередная компенсация по `konkName` за сегодняшний `sliceDate` (analog + sku). Контракт: [`docs/api/slice-compensation.md`](../api/slice-compensation.md). Гайд для UI: [`docs/frontend/manual-compensating-slice.md`](../frontend/manual-compensating-slice.md).
