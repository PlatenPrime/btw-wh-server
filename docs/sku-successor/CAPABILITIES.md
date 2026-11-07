# Capabilities текущего SKU-стека

Продуктовые возможности, которые successor должен покрыть (форма RPC/UI — свободная). Детали контрактов — в [LEGACY_POINTERS.md](./LEGACY_POINTERS.md).

## Каталог Sku

- Список с пагинацией, фильтрами `konkName` / `prodName` / `search` / `isInvalid` / `createdFrom` / «не в одной skugr».
- Карточка по id (+ вычисляемые группы skugr).
- Список SKU группы `by-skugr`.
- Create / PATCH (в т.ч. artikul, btradeAnalog, imageUrl).
- Delete одной карточки с чисткой ссылок в `skugr.skus`.
- Массовое удаление «свободных» SKU; удаление invalid по konk / all.
- Live stock/price по URL конкурента (не из slice).
- Fix incorrect sku data (админ-операция).
- Домен: `newsku`, канон productId, isInvalid из крона.

Модуль: [docs/modules/skus.md](../modules/skus.md).

## Группы Skugr

- CRUD метаданных группы; `isSliced`.
- Состав `skus` при create; fill-skus из листинга browser; clear-skus; purge promoted from newsku.
- Delete группы; delete with-skus с чисткой пересечений.
- Air idle: server fill отключён → client ingest постранично.
- Weekly refill cron.

Модуль: [docs/modules/skugrs.md](../modules/skugrs.md).

## Справочники

- **Konk** — CRUD/справочник конкурентов, recountDays, imageUrl.
- **Prod** — shared производители (склад + SKU).

## Срезы Sku

- Чтение точек / range по sku; day meta observability.
- Ночной сбор срезов по конкурентам + post-corrections.
- Compensation недостоверных точек.
- Band-spike discover + RTL correct (preview/apply).
- Air client slice ingest при необходимости.

Модуль: [docs/modules/sku-slices.md](../modules/sku-slices.md).

## Отчётность (JSON)

- Продажи: sku by-date / range, skugr daily-summary, konk-prod skugr-groups-sales, skugr skus-sales, selection aggregates.
- Charts/pie: konk-prod stock/sales, manufacturers pie, selection skus pie.
- Shared materialize rollups Sku + Btrade manufacturer day sales.

Модули: [sku-reporting](../modules/sku-reporting.md), [sku-sales-reports](../modules/sku-sales-reports.md), [sku-chart-reports](../modules/sku-chart-reports.md).

## Excel (legacy поведение → новый пайплайн)

Референс needs, не копипаст architecture:

- Catalog: new-since, invalid (в т.ч. konk=`all`).
- Stock/sales excel: one sku, skugr, konk, selection.
- Skugr skus share.
- Опционально includeImages / metrics.
- Async job: queue → progress → download; TTL; лимит активных на user.

Legacy: [excel-jobs](../modules/excel-jobs.md), kinds sku-* / grabo-skus / konk-btrade-*.

## Btrade как конкурент

- Дневные срезы quantity/price по artikul (month store).
- Manufacturer day sales rollup.
- Сравнение с конкурентами в отчётах/excel (legacy kinds comparison).
- В successor: scrapers/парсинг в `competitors/btrade` под те же коллекции.

Модуль: [docs/modules/btrade-slices.md](../modules/btrade-slices.md).

## Grabo (не конкурент)

- Карточки каталога, sync с сайта, флаги isOnSite / isNewProduct.
- Weekly sync cron; UI/list/filters; excel kind grabo-skus (поведение).

Модуль: [docs/modules/grabo-skus.md](../modules/grabo-skus.md).

## Scrapers / browser

По конкуренту: live stock карточки, group listing fill, HTML parsers, transport/proxy/cookies, PromUA shared helpers, Air client HTML ingest.

Модуль: [docs/modules/browser.md](../modules/browser.md).

В successor — директория на конкурента + shared kit; публичные demo GET stock не переносим.

## Auth

- Login / register / me / users / roles.
- JWT Bearer; роли USER < EDITOR < ADMIN < PRIME.
- Матрица доступа SKU-операций — ориентир [access-matrix](../api/access-matrix.md); в closed API те же минимумы ролей на server fn.

Модуль: [docs/modules/auth.md](../modules/auth.md).

## Вне периметра (не переносить)

- Складской домен (arts, poses, pallets, asks, …).
- Warehouse-only excel kinds (arts-export, zones-export, …) — остаются старому, кроме grabo/sku/btrade-сравнений в SKU-продукте.

## Удалено из продукта (не реализовывать в successor)

- **Analogs / analog-slices** — домен снят из `btw-wh-server` (2026-11-07): нет CRUD, live stock API, primary/compensating analog slices, analog excel kinds (`analog-comparison`, `analog-sales-comparison`, `konk-btrade-comparison`, `konk-btrade-sales-comparison` на базе Analog).
- Поле `Sku.btradeAnalog` остаётся (связь карточки SKU с артикулом BTrade) — это не модуль Analog.
- Сравнения конкурент↔Btrade в successor — только через SKU / sku-slices / btrade-slices.
