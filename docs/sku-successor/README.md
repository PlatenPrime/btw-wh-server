# SKU-successor — референс для нового проекта

Папка — **первичный бриф** для отдельного репозитория SKU-продукта (TanStack Start + worker). Runtime `btw-wh-server` до дня Д не меняется ради миграции: SKU API и cron продолжают жить здесь.

## Зачем

Параллельно держим складской бэкенд и новый SKU-проект на одной MongoDB. Здесь зафиксировано:

- что в БД **нельзя ломать** (коллекции, поля, индексы, доменные инварианты);
- что в новом проекте **можно пересобрать** (директории, RPC/API, excel, UX, раскладка scrapers);
- как не устроить dual-writer до cutover;
- как после коммитов в этот репо синхронизировать требования в successor.

## Как читать

| Файл                                           | Содержание                                          |
| ---------------------------------------------- | --------------------------------------------------- |
| [PRINCIPLES.md](./PRINCIPLES.md)               | Frozen vs redesign, closed API, dual-run, день Д    |
| [DOMAIN_MAP.md](./DOMAIN_MAP.md)               | Сущности, связи, периметр / вне периметра           |
| [FROZEN_MODELS.md](./FROZEN_MODELS.md)         | Контракт Mongo: коллекции, поля, индексы            |
| [CRONS_AND_CUTOVER.md](./CRONS_AND_CUTOVER.md) | Расписания Kyiv, writers, окно cutover              |
| [CAPABILITIES.md](./CAPABILITIES.md)           | Продуктовые возможности текущего SKU-стека          |
| [TARGET_LAYOUT.md](./TARGET_LAYOUT.md)         | Целевая раскладка директорий нового репо            |
| [LEGACY_POINTERS.md](./LEGACY_POINTERS.md)     | Ссылки на `docs/modules`, `docs/api`, `src/modules` |
| [sync/](./sync/)                               | Дельты после SKU-релевантных коммитов               |

## Периметр (кратко)

**Внутри:** skus, skugrs, konks, shared prods, sku-slices / reporting / sales / chart, btrade как конкурент, grabo как отдельный не-конкурент, scrapers по конкурентам, auth как в старом проекте.

**Снаружи:** складской домен. **Analogs / analog-slices удалены** из продукта (2026-11-07) — successor их не реализует.

Excel в successor — **с нуля**; текущие excel-jobs kinds — референс поведения, не обязательная архитектура.

## Процесс синка

Любой коммит в `btw-wh-server`, затрагивающий периметр → файл в `sync/` + при необходимости правка `FROZEN_MODELS` / `CAPABILITIES` / `CRONS_AND_CUTOVER`. См. [sync/README.md](./sync/README.md) и правило `.cursor/rules/sku-successor-sync.mdc`.
