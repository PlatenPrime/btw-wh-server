# Модуль Defs

## Описание модуля

Модуль `defs` считает дефициты товаров on-the-fly: сравнивает остатки на складе pogrebi (позиции с `palletData.isDef`) с актуальными остатками sharik.ua из bulk-страницы `product_rests` (`actualQuantity`). Результат не сохраняется в MongoDB — каждый запрос `GET /latest` выполняет живой расчёт. Тот же расчёт по будням раз в час (09:20–17:20 Europe/Kyiv) уходит снимком в Telegram-чат дефицитов. Связь с заявками (`Ask`) позволяет видеть уже созданные запросы на пополнение.

## Сущности модуля

### LiveDefsCalculation (результат расчёта)

Эфемерный снимок дефицитов на момент запроса или cron-тика: `result` по артикулам, totals, `calculatedAt`. Документа в БД нет.

### DeficitItem (элемент дефицита)

Информация о дефиците конкретного артикула: `nameukr` (из poses), `quant` (склад), `sharikQuant` (актуальный остаток sharik), `difQuant`, `defLimit` (`quant + artLimit`), `status` (`limited` | `critical`).

## Связи

- **Poses → Defs:** вход — объединённые def-позиции pogrebi (`getPogrebiDefStocks`), включая `nameukr`.
- **Art → Defs:** только лимиты (`getArtLimits`); названия не подтягиваются отдельно.
- **browser/sharik product_rests → Defs:** `actualQuantity` как `sharikQuant` (in-memory cache TTL ~1ч).
- **Ask → Defs:** enrichment `existingAsk` для статусов `new` (только HTTP `GET /latest`, в Telegram-снимок заявки не входят).
- **Telegram defs chat → Defs:** hourly cron шлёт список `artikul: difQuant` по статусам limited/critical и итоговую сводку.

## Концепции и принятые решения

### Живой расчёт без хранения

Раньше дефициты считались поштучным search и сохранялись в коллекцию `defs` с прогрессом и cron. Теперь один bulk `product_rests` делает расчёт быстрым; снимки в БД и progress endpoint удалены. Cron вернули только как рассылку живого снимка в чат дефицитов: перед тиком сбрасывается in-memory cache `product_rests`, чтобы Telegram не уехал на час от кэша `GET /latest`.

### Telegram-снимок

Пн–пт, каждый час с 09:20 по 17:20 Europe/Kyiv. Сообщения чанками по 20 артикулов: сначала limited, затем critical, затем totals. Пустой расчёт — одно empty-state сообщение. Ошибка расчёта уходит в тот же чат. Стартовое «расчёт запущен» не шлётся: расчёт занимает секунды.

### Статусы дефицита

- **critical:** `sharikQuant <= quant`
- **limited:** `quant < sharikQuant <= quant + artLimit`

### nameukr

Берётся из poses (`mergePoses`), не из sharik и не отдельным запросом к Art.

## API

Единственный эндпоинт: **GET `/api/defs/latest`** (роль ≥ USER). Контракт — [docs/api/defs.md](../api/defs.md). Breaking changes для UI — [docs/frontend/defs-live-calculation.md](../frontend/defs-live-calculation.md).
