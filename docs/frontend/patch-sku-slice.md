# Фронтенд: ручная правка точки / диапазона SkuSlice

## Задача

Дать админу форму «SKU + дата (или диапазон) + stock/price», чтобы поправить сырую точку среза за любой календарный день или сразу за период одинаковыми значениями, без повторного scrape и без pack-flip apply. Типичный кейс: после TG-отчёта pack-flip вернуть масштаб витрины (`3 / 110` вместо `60 / 5.5`) на один день или на несколько дней подряд. Документ среза на дату создаётся бэкендом (upsert), если его ещё не было.

## API

- Метод/путь: `PATCH /api/sku-slices/sku/:skuId`
- Auth: JWT, роль ≥ ADMIN
- Path: `skuId` — MongoDB ObjectId SKU
- Body XOR:
  - один день: `{ date, stock, price }`
  - диапазон: `{ dateFrom, dateTo, stock, price }` (`dateFrom` ≤ `dateTo`, max 366 дней)
- Не слать `date` вместе с `dateFrom`/`dateTo`
- Предпросмотр текущей точки: `GET /api/sku-slices/sku/:skuId?date=`
- Ряд за период: `GET /api/sku-slices/sku/:skuId/range?dateFrom=&dateTo=`
- Поиск SKU по `perfect-14938`: `GET /api/skus?search=perfect-14938`
- Полный контракт: [`docs/api/sku-slices.md`](../api/sku-slices.md)

Один запрос = один SKU и либо один день, либо весь диапазон с одним `stock`/`price`. Клиентский цикл PATCH по дням не нужен.

## UX

### Точка входа

Карточка SKU / график остатков / строка pack-flip review (ADMIN/PRIME). Подпись в духе «Исправить срез» / «Править точку / диапазон».

### Форма

1. SKU уже известен с карточки или найден через `search` по `productId`.
2. Режим: одна дата или диапазон (`dateFrom`–`dateTo`).
3. Перед Submit по одной дате — `GET` той же даты, показать текущие `stock`/`price` (или отсутствие ключа).
4. Поля `stock` и `price` — обязательны, числа.
5. Короткое пояснение: это сырая запись в `SkuSlice`, не live-scrape и не compensating slice; pack-flip следующей ночью ориентируется на эти значения.
6. После Submit — loading; повтор того же PATCH не слать, пока предыдущий в полёте.

### После ответа

| Статус | Поведение UI |
|--------|----------------|
| 200 (день) | Показать новые `stock`/`price`, `previous`, `created`; инвалидировать кэш точки и графика |
| 200 (диапазон) | Показать `updatedCount` и при необходимости развернуть `days`; инвалидировать кэш range/графика |
| 400 | Ошибка валидации (skuId / XOR дат / длина диапазона / не число) |
| 404 | Toast: нет SKU или пустой productId |
| 401/403 | Стандартная обработка сессии/прав |
| 500 | Toast ошибки; предложить повторить позже |

### Не делать

- Не вызывать `POST /api/slice-compensation/run` вместо PATCH: compensation — повторный scrape битых `-1`, не правка масштаба.
- Не слать apply в `GET /api/sku-slices/pack-flips`: review всегда dry-run; запись — только этот PATCH.
- Не подменять live-stock (`GET /api/skus/id/:id/stock`): он не пишет срез.
- Не слать цикл PATCH по дням диапазона — один запрос с `dateFrom`/`dateTo`.
