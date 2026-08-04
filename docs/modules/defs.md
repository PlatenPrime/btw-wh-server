# Модуль Defs

## Описание модуля

Модуль `defs` считает дефициты товаров on-the-fly: сравнивает остатки на складе pogrebi (позиции с `palletData.isDef`) с актуальными остатками sharik.ua из bulk-страницы `product_rests` (`actualQuantity`). Результат не сохраняется в MongoDB — каждый запрос `GET /latest` выполняет живой расчёт. Связь с заявками (`Ask`) позволяет видеть уже созданные запросы на пополнение.

## Сущности модуля

### LiveDefsCalculation (результат расчёта)

Эфемерный снимок дефицитов на момент запроса: `result` по артикулам, totals, `calculatedAt`. Документа в БД нет.

### DeficitItem (элемент дефицита)

Информация о дефиците конкретного артикула: `nameukr` (из poses), `quant` (склад), `sharikQuant` (актуальный остаток sharik), `difQuant`, `defLimit` (`quant + artLimit`), `status` (`limited` | `critical`).

## Связи

- **Poses → Defs:** вход — объединённые def-позиции pogrebi (`getPogrebiDefStocks`), включая `nameukr`.
- **Art → Defs:** только лимиты (`getArtLimits`); названия не подтягиваются отдельно.
- **browser/sharik product_rests → Defs:** `actualQuantity` как `sharikQuant` (in-memory cache TTL ~1ч).
- **Ask → Defs:** enrichment `existingAsk` для статусов `new`.

## Концепции и принятые решения

### Живой расчёт без хранения

Раньше дефициты считались поштучным search и сохранялись в коллекцию `defs` с прогрессом и cron. Теперь один bulk `product_rests` делает расчёт быстрым; снимки в БД, progress endpoint и cron удалены.

### Статусы дефицита

- **critical:** `sharikQuant <= quant`
- **limited:** `quant < sharikQuant <= quant + artLimit`

### nameukr

Берётся из poses (`mergePoses`), не из sharik и не отдельным запросом к Art.

## API

Единственный эндпоинт: **GET `/api/defs/latest`** (роль ≥ USER). Контракт — [docs/api/defs.md](../api/defs.md). Breaking changes для UI — [docs/frontend/defs-live-calculation.md](../frontend/defs-live-calculation.md).
