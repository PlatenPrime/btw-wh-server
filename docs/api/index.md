# API Документация

## Общий обзор

API системы управления складом предоставляет RESTful интерфейс для работы со всеми модулями системы. API использует стандартные HTTP методы (GET, POST, PUT, PATCH, DELETE) и возвращает данные в формате JSON.

## Базовые пути

Все API эндпоинты имеют базовый путь `/api`, за которым следует название модуля. **Кто каким методом может пользоваться** — в едином реестре: [Матрица доступа](access-matrix.md).

- [API Analog Slices](analog-slices.md) — `/api/analog-slices` — срезы остатков и цен аналогов по датам
- [API Analogs](analogs.md) — `/api/analogs` — аналоги артикулов у конкурентов
- [API Variants](variants.md) — `/api/variants` — варианты товаров у конкурентов
- [API Browser](browser.md) — `/api/browser` — остаток и цена по URL страницы товара (yumi, yumin)
- [API Btrade Slices](btrade-slices.md) — `/api/btrade-slices` — срезы Btrade
- [API Auth](auth.md) — `/api/auth` — аутентификация и управление пользователями
- [API Arts](arts.md) — `/api/arts` — артикулы
- [API Asks](asks.md) — `/api/asks` — заявки
- [API Kasks](kasks.md) — `/api/kasks` — запросы доставить к кассе
- [API Blocks](blocks.md) — `/api/blocks` — блоки
- [API Constants](constants.md) — `/api/constants` — именованные константы приложения
- [API Segs](segs.md) — `/api/segs` — сегменты
- [API Zones](zones.md) — `/api/zones` — зоны
- [API Rows](rows.md) — `/api/rows` — ряды
- [API Pallets](pallets.md) — `/api/pallets` — паллеты
- [API Pallet Groups](pallet-groups.md) — `/api/pallet-groups` — группы паллет
- [API Poses](poses.md) — `/api/poses` — позиции
- [API Defs](defs.md) — `/api/defs` — расчёт дефицитов
- [API Dels](dels.md) — `/api/dels` — поставки
- [API Konks](konks.md) — `/api/konks` — конкуренты
- [API Prods](prods.md) — `/api/prods` — производители
- [API Skus](skus.md) — `/api/skus` — товары конкурентов (sku)
- [API Skugrs](skugrs.md) — `/api/skugrs` — группы товаров конкурента
- [API Sku Slices](sku-slices.md) — `/api/sku-slices` — ежедневные срезы остатков и цен по SKU конкурентов (корневой GET с пагинацией и маппингом на Sku), Excel и агрегаты по группам (в т.ч. Skugr)

## Аутентификация

Все защищенные эндпоинты требуют аутентификации через JWT токен. Токен передается в заголовке `Authorization` в формате:

```
Authorization: Bearer <token>
```

Токен получается при успешном входе через эндпоинт `/api/auth/login` и содержит информацию о пользователе и его роли.

Публичные маршруты (без JWT): `POST /api/auth/login`, `POST /api/auth/register`, все `GET` под `/api/browser/*` — см. [Матрица доступа](access-matrix.md).

## Роли и права доступа

В коде заданы четыре роли (`RoleType` в `src/constants/roles.ts`) и **иерархия уровней**: PRIME (4) > ADMIN (3) > EDITOR (2) > USER (1). Middleware `checkRoles` после `checkAuth` разрешает доступ, если у пользователя уровень **не ниже** минимального, указанного для маршрута. Например, при требовании «минимум USER» подходят USER, EDITOR, ADMIN и PRIME; при требовании «минимум ADMIN» — ADMIN и PRIME.

- **USER** — просмотр и операции «поля» (заявки, каски, часть складских чтений и т.д. по матрице).
- **EDITOR** — промежуточный уровень: например, операции с паллетами и позициями без полномочий администратора по конкурентным данным.
- **ADMIN** — управление большинством сущностей, справочники конкурентов, срезы, константы, группы паллет (чтение/изменение по матрице).
- **PRIME** — создание пользователей и полное обновление учётных данных, массовые/опасные удаления и upsert-операции там, где в роутере задано `PRIME`.

Отдельные маршруты используют **дополнительные правила** (например, владение ресурсом), а не только роль — это отражено в [Матрице доступа](access-matrix.md).

Точный перечень методов, путей и условий: **[Матрица доступа](access-matrix.md)**. В файлах отдельных модулей ниже — в основном форматы данных; при расхождении с роутером источником истины остаётся код и матрица.

## Стандартные форматы запросов и ответов

### Формат запроса

Запросы с телом (POST, PUT, PATCH) должны иметь заголовок `Content-Type: application/json` и тело в формате JSON.

### Формат успешного ответа

Успешные ответы возвращают статус код 200 (или 201 для создания) и данные в формате JSON:

```json
{
  "message": "Описание операции",
  "data": {
    /* данные */
  }
}
```

Или для списков:

```json
{
  "exists": true,
  "message": "Описание операции",
  "data": [
    /* массив данных */
  ]
}
```

### Формат ошибки

Ошибки возвращают соответствующий HTTP статус код и описание ошибки:

```json
{
  "message": "Описание ошибки",
  "errors": [
    /* массив ошибок валидации (опционально) */
  ]
}
```

## Коды ошибок

- **400 Bad Request** - ошибка валидации входных данных или некорректный запрос
- **401 Unauthorized** - отсутствует или неверный токен аутентификации
- **403 Forbidden** - недостаточно прав для выполнения операции
- **404 Not Found** - запрашиваемый ресурс не найден
- **409 Conflict** - конфликт данных (например, дублирование уникального значения)
- **500 Internal Server Error** - внутренняя ошибка сервера

## Валидация данных

Все входные данные валидируются с использованием библиотеки Zod. При ошибке валидации возвращается статус 400 с массивом ошибок:

```json
{
  "message": "Validation error",
  "errors": [
    {
      "path": ["fieldName"],
      "message": "Описание ошибки"
    }
  ]
}
```

## Идентификаторы

Все идентификаторы в системе используют формат MongoDB ObjectId (24-символьная шестнадцатеричная строка). Идентификаторы передаются в path параметрах или в теле запроса.

## Пагинация

Эндпоинты, возвращающие списки данных, поддерживают пагинацию через query параметры:

- `page` - номер страницы (начинается с 1)
- `limit` - количество элементов на странице

Ответ содержит информацию о пагинации:

```json
{
  "data": [
    /* данные */
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Поиск

Многие эндпоинты поддерживают поиск через query параметр `search`. Поиск выполняется по текстовым полям (названия, артикулы и т.д.).

## Сортировка

Эндпоинты, возвращающие списки данных, могут поддерживать сортировку через query параметры:

- `sortBy` - поле для сортировки
- `sortOrder` - направление сортировки ("asc" или "desc")

## Транзакции

Критичные операции выполняются в рамках MongoDB транзакций для обеспечения целостности данных. Это гарантирует что либо все изменения применяются, либо ни одно не применяется.

## Кэширование данных

Многие модули кэшируют связанные данные (например, данные пользователя в заявках, данные паллеты в позициях) для повышения производительности. Кэшированные данные обновляются при изменении связанных сущностей.

## Документация модулей

Детальная документация по эндпоинтам и форматам данных каждого модуля (по базовым путям). Доступ по ролям — [Матрица доступа](access-matrix.md).

- [API Analog Slices](analog-slices.md)
- [API Analogs](analogs.md)
- [API Variants](variants.md)
- [API Browser](browser.md)
- [API Btrade Slices](btrade-slices.md)
- [API Auth](auth.md)
- [API Arts](arts.md)
- [API Asks](asks.md)
- [API Kasks](kasks.md)
- [API Blocks](blocks.md)
- [API Constants](constants.md)
- [API Segs](segs.md)
- [API Zones](zones.md)
- [API Rows](rows.md)
- [API Pallets](pallets.md)
- [API Pallet Groups](pallet-groups.md)
- [API Poses](poses.md)
- [API Defs](defs.md)
- [API Dels](dels.md)
- [API Konks](konks.md)
- [API Prods](prods.md)
- [API Skus](skus.md)
- [API Skugrs](skugrs.md)
- [API Sku Slices](sku-slices.md)

Концептуальная документация модулей (сущности, связи, решения): [../modules/](../modules/) — analog-slices, analogs, auth, arts, asks, kasks, blocks, segs, zones, rows, pallets, [pallet-groups](../modules/pallet-groups.md), poses, defs, dels, konks, prods, skus, skugrs, sku-slices, [browser](../modules/browser.md), [btrade-slices](../modules/btrade-slices.md), [slices](../modules/slices.md), [slice-compensation](../modules/slice-compensation.md), variants, constants.
