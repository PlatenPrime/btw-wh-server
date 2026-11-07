# Sync deltas → SKU-successor

После каждого коммита в `btw-wh-server`, который затрагивает SKU-периметр, добавляется файл дельты. Successor читает эти файлы, чтобы не отставать от фич старого проекта до дня Д.

## Когда писать дельту

Изменения в любом из:

- `src/modules/skus`, `skugrs`, `konks`, `prods`, `sku-slices`, `sku-reporting`, `sku-sales-reports`, `sku-chart-reports`, `sku-excel-reports`
- `src/modules/btrade-slices`, `grabo-skus`, `browser`, `slices` (SKU-релевантный config), `slice-compensation` (SKU-ветка)
- `src/modules/excel-jobs` kinds sku-* / grabo / konk-btrade-*
- `src/modules/auth` / roles, если меняется доступ для SKU-операций
- соответствующие `docs/modules/*`, `docs/api/*` по этому периметру
- сама папка `docs/sku-successor/` (кроме тривиальных typo) — тоже можно отразить bootstrap/follow-up

Не нужна дельта: чисто складские модули (arts, poses, asks, …), analog-only, форматирование без поведения.

## Как писать

1. Скопировать [_TEMPLATE.md](./_TEMPLATE.md) → `YYYY-MM-DD-<short-slug>.md` (дата коммита или мержа в целевую ветку).
2. Заполнить hash, краткое «что изменилось», флаги impact (DB / capability / cron).
3. Если изменилась схема Mongo — **сначала** обновить [../FROZEN_MODELS.md](../FROZEN_MODELS.md) (для Prod — пометка shared).
4. При сдвиге поведения продукта — [../CAPABILITIES.md](../CAPABILITIES.md); расписаний/writers — [../CRONS_AND_CUTOVER.md](../CRONS_AND_CUTOVER.md).
5. В дельте указать implied work для successor.

Имя файла: латиница/kebab, без пробелов. Один логический коммит/PR — один файл (или один файл на squash-merge).

## Правило агента

См. [.cursor/rules/sku-successor-sync.mdc](../../../.cursor/rules/sku-successor-sync.mdc).
