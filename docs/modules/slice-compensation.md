# Модуль Slice Compensation (Компенсирующие срезы)

## Описание модуля

Модуль `slice-compensation` выполняет **повторный опрос** позиций в сегодняшних документах `AnalogSlice` и `SkuSlice`, где первичный скрапинг вернул недостоверные данные. Новые документы срезов не создаются — обновляются отдельные ключи в поле `data` существующего документа на текущую дату.

Тип модуля: **cron-only** — только `cron/` + `utils/`, без `router.ts` и `controllers/`.

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
- **sku-slices** — jitter между запросами (`skuSliceRequestJitterMs`).

## Концепции и принятые решения

### Частичное обновление MongoDB

Каждая успешная компенсация делает `$set: { [`data.${key}`]: { stock, price } }` — без перезаписи всего документа среза.

### Параллельность и последовательность

В одном cron-tick analog и sku runs выполняются через `Promise.all`. Внутри каждого run позиции обрабатываются **последовательно** с jitter (как при первичном сборе SKU-срезов).

### Ключевые файлы

- [`cron/startCompensatingSlicesCron.ts`](../../src/modules/slice-compensation/cron/startCompensatingSlicesCron.ts) — планировщик;
- [`utils/compensatingSliceRunner.ts`](../../src/modules/slice-compensation/utils/compensatingSliceRunner.ts) — построение очереди и цикл refetch;
- [`utils/runCompensatingAnalogSlices.ts`](../../src/modules/slice-compensation/utils/runCompensatingAnalogSlices.ts);
- [`utils/runCompensatingSkuSlices.ts`](../../src/modules/slice-compensation/utils/runCompensatingSkuSlices.ts).

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

Отсутствует. Модуль не экспонирует API.
