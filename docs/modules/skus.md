# Модуль Skus (SKU конкурентов)

## Описание модуля

Модуль `skus` хранит карточки товаров конкурентов (SKU) и предоставляет базовые CRUD-операции. Каждая запись связывает конкурента (`konkName`) и производителя (`prodName`) с названием товара, ссылкой на страницу конкурента и опциональным артикулом `btradeAnalog`.

## Сущности модуля

### Sku (Товар конкурента)

Sku — документ, описывающий единицу товара конкурента. Поля:

- `konkName`: string — имя-ключ конкурента
- `prodName`: string — имя-ключ производителя
- `btradeAnalog`: string — аналог артикула BTrade, по умолчанию `""`
- `title`: string — название товара
- `url`: string — ссылка на страницу товара у конкурента (уникальная)
- `imageUrl`: string — URL изображения товара (по умолчанию `""`)
- `isInvalid`: boolean — по умолчанию `false`; `true`, если в последнем недельном прогоне крона за **7 подряд** календарных дней среза (ключ даты как у `SkuSlice`) для этого `konkName` и `productId` в каждом из дней есть документ среза и в `data[productId]` одновременно `stock === -1` и `price === -1`. Если в один из дней документа среза нет — условие не выполняется, флаг сбрасывается в `false`.
- `_id`, `createdAt`, `updatedAt`: системные поля MongoDB

## Связи между сущностями

Модуль не содержит жёстких внешних ключей на уровне БД, но использует строковые ключи `konkName` и `prodName` для доменной связи с модулями конкурентов и производителей.

## Концепции и принятые решения

### Уникальность `url`

Для предотвращения дублей карточек установлен уникальный индекс по `url`.

### Дефолт для `btradeAnalog`

Поле `btradeAnalog` всегда присутствует в документе и имеет значение `""`, если аналог не назначен.

### Поле `imageUrl`

Строка с URL картинки; при отсутствии в запросе или при создании через API без поля — `""`. При массовом заполнении из `fill-skus` значение приходит из парсера группы конкурента.

### Чтение с фильтрами и пагинацией

Список SKU поддерживает:

- фильтры по `konkName` и `prodName`;
- опциональный `search` — регистронезависимый поиск по подстроке в `title` (как у списка групп skugrs);
- опционально `isInvalid` (`true` / `false` в query) и `createdFrom` (`YYYY-MM-DD`) — «новинки» не раньше этой даты;
- пагинацию через `page` и `limit`;
- возврат блока `pagination` в ответе.

### Крон `SkuInvalid`

Раз в неделю (понедельник 03:00 `Europe/Kyiv`, см. `startSkuInvalidFlagCron`) выполняется пересчёт `isInvalid` для всех SKU по правилу выше. Поле не задаётся через create/update API.

### Роли доступа

- чтение (`GET`) — роль USER;
- создание и обновление (`POST`, `PATCH`) — роль ADMIN;
- удаление (`DELETE`) — роль PRIME.

Массовое создание SKU при привязке к группе конкурента выполняется через **POST `/api/skugrs/id/:id/fill-skus`** (см. [модуль Skugrs](./skugrs.md) и [API Skugrs](../api/skugrs.md)).

Список SKU конкретной группы (по id из поля `skugr.skus`) — **GET `/api/skus/by-skugr/:skugrId`** с пагинацией и поиском по `title`, см. [API Skus](../api/skus.md).

## API эндпоинты

- `GET /api/skus` — список SKU с пагинацией и фильтрами
- `GET /api/skus/by-skugr/:skugrId` — SKU группы по id `skugr` (множество `_id` из `skugr.skus`)
- `GET /api/skus/id/:id` — получение SKU по id
- `POST /api/skus` — создание SKU
- `PATCH /api/skus/id/:id` — частичное обновление SKU
- `DELETE /api/skus/id/:id` — удаление SKU
- `GET /api/skus/konk/:konkName/new-since-excel?since=YYYY-MM-DD` — Excel новинок конкурента с даты
- `GET /api/skus/konk/:konkName/invalid-excel` — Excel SKU с `isInvalid`
- `DELETE /api/skus/konk/:konkName/invalid` — удаление всех невалидных SKU конкурента (PRIME)

## Формат данных Sku

- `_id`: string (MongoDB ObjectId)
- `konkName`: string
- `prodName`: string
- `btradeAnalog`: string
- `title`: string
- `url`: string (unique)
- `imageUrl`: string
- `isInvalid`: boolean
- `createdAt`: Date
- `updatedAt`: Date
