# Модуль sku-stock-bands

## Задача

Конкуренты иногда публикуют фиктивный остаток (дефолт на день поставки, случайные миллионы). Это порождает ложные продажи при падении «всплеска» к реальному значению. Модуль хранит **сохранённые диапазоны аномального остатка** на конкурента, чтобы оператор не вбивал `stockMin`/`stockMax` вручную каждый раз и мог открыть диапазон, выбрать даты и подтвердить пакетную RTL-коррекцию.

Старый ручной band-spike (`/band-spike/discover` + single-SKU correct) остаётся параллельным контуром для сравнения UX.

## Сущность

**SkuStockBand** (коллекция `sku_stock_bands`) — один профиль полосы остатка:

- `konk` — `{ name, title }` конкурента (`title` с сервера из `Konk`);
- `stockMin` / `stockMax` — полоса «аномального» остатка (то, что ищем);
- `normalMax` — верх нормального остатка для sandwich-якорей (`normalMax < stockMin`). Discover и batch требуют right `≤ normalMax`; left — только если день с данными есть (иначе RTL от правого якоря до первого дня run в окне). Не принимать высокий остаток ниже band, но выше нормы, за возврат в норму.

У одного `konk.name` может быть сколько угодно диапазонов. Даты поиска в документ не входят — задаются при discover/batch.

## Связи

- `konk.name` ↔ `Konk.name`.
- Discover/batch в [sku-slices](sku-slices.md) читают band и правят точки в `SkuSliceMonth`, затем rematerialize sales.

## HTTP

CRUD `/api/sku-stock-bands`. Операции просмотра всплесков и batch-correct — в sku-slices по `bandId`.

Подробности API: [sku-stock-bands](../api/sku-stock-bands.md), гайд UI: [frontend: sku-stock-bands](../frontend/sku-stock-bands.md).
