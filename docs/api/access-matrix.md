# Матрица доступа API

Полный перечень HTTP-маршрутов и условий доступа по состоянию роутеров в `src/modules/*/router.ts` и монтированию в `src/index.ts`.

## Как читать таблицы

| Колонка | Значение |
|--------|----------|
| **Аутентификация** | `Нет` — маршрут без `checkAuth`. `JWT` — нужен заголовок `Authorization: Bearer <token>`. |
| **Доступ** | Для защищённых маршрутов указана **минимальная роль** из `RoleType` в [`src/constants/roles.ts`](../../src/constants/roles.ts). Проверка через [`checkRoles`](../../src/middleware/checkRoles.ts): учитывается **иерархия** PRIME (4) > ADMIN (3) > EDITOR (2) > USER (1). Запись **≥ USER** означает: подходят USER, EDITOR, ADMIN и PRIME. |

Исключения с дополнительной логикой описаны явно (например, владение ресурсом).

---

## `/api/auth`

| Метод | Путь (относительно префикса) | Аутентификация | Доступ |
|-------|------------------------------|----------------|--------|
| POST | `/login` | Нет | Публично |
| POST | `/register` | Нет | Публично |
| GET | `/users` | JWT | ≥ ADMIN |
| POST | `/users` | JWT | ≥ PRIME |
| GET | `/users/:id` | JWT | ≥ USER |
| GET | `/me/:id` | JWT | ≥ USER |
| PUT | `/users/:userId` | JWT | ≥ PRIME |
| GET | `/roles` | JWT | ≥ ADMIN |

---

## `/api/browser`

| Метод | Путь | Аутентификация | Доступ |
|-------|------|----------------|--------|
| GET | `/air/stock` | Нет | Публично |
| GET | `/balun/stock` | Нет | Публично |
| GET | `/perfect/stock` | Нет | Публично |
| GET | `/yumi/stock` | Нет | Публично |
| GET | `/yumin/stock` | Нет | Публично |
| GET | `/sharte/stock` | Нет | Публично |
| GET | `/sharik/stock/:artikul` | Нет | Публично |

---

## `/api/arts`

| Метод | Путь | Аутентификация | Доступ |
|-------|------|----------------|--------|
| GET | `/` | JWT | ≥ USER |
| GET | `/zone/:zone` | JWT | ≥ USER |
| GET | `/id/:id` | JWT | ≥ USER |
| GET | `/artikul/:artikul` | JWT | ≥ USER |
| GET | `/btrade/:artikul` | JWT | ≥ USER |
| PATCH | `/:id/limit` | JWT | ≥ ADMIN |
| POST | `/upsert` | JWT | ≥ ADMIN |
| PATCH | `/:artikul/btrade-stock` | JWT | ≥ ADMIN |
| PATCH | `/:id` | JWT | ≥ ADMIN |
| POST | `/btrade-stock/update-all` | JWT | ≥ ADMIN |
| GET | `/export` | JWT | ≥ ADMIN |
| GET | `/export-with-stocks` | JWT | ≥ ADMIN |
| GET | `/export-keys` | JWT | ≥ ADMIN |
| DELETE | `/without-latest-marker` | JWT | ≥ PRIME |

---

## `/api/asks`

| Метод | Путь | Аутентификация | Доступ |
|-------|------|----------------|--------|
| POST | `/` | JWT | ≥ USER |
| GET | `/by-date` | JWT | ≥ USER |
| GET | `/by-artikul` | JWT | ≥ USER |
| GET | `/pulls` | JWT | ≥ USER |
| GET | `/:id/pull` | JWT | ≥ USER |
| GET | `/:id` | JWT | ≥ USER |
| PATCH | `/:id/pull` | JWT | ≥ EDITOR |
| PATCH | `/:id/complete` | JWT | ≥ EDITOR |
| PATCH | `/:id/reject` | JWT | ≥ EDITOR |
| PATCH | `/:id/actions` | JWT | ≥ EDITOR |
| DELETE | `/:id` | JWT | Роль PRIME или ADMIN (доступ к любой заявке) **или** иначе: пользователь — владелец (`asker` в совпадении с id из JWT); роль USER/EDITOR при несовпадении — отказ |

---

## `/api/kasks`

| Метод | Путь | Аутентификация | Доступ |
|-------|------|----------------|--------|
| POST | `/` | JWT | ≥ USER |
| GET | `/by-date` | JWT | ≥ USER |
| GET | `/:id` | JWT | ≥ USER |
| PATCH | `/:id` | JWT | ≥ USER |
| DELETE | `/:id` | JWT | ≥ PRIME |

---

## `/api/dels`

| Метод | Путь | Аутентификация | Доступ |
|-------|------|----------------|--------|
| GET | `/` | JWT | ≥ USER |
| GET | `/id/:id` | JWT | ≥ USER |
| POST | `/` | JWT | ≥ ADMIN |
| DELETE | `/id/:id` | JWT | ≥ PRIME |
| PATCH | `/:id/title` | JWT | ≥ ADMIN |
| PATCH | `/:id/artikuls/:artikul` | JWT | ≥ ADMIN |
| POST | `/:id/artikuls/update-all` | JWT | ≥ ADMIN |

---

## `/api/defs`

| Метод | Путь | Аутентификация | Доступ |
|-------|------|----------------|--------|
| POST | `/calculate` | JWT | ≥ ADMIN |
| GET | `/latest` | JWT | ≥ USER |
| GET | `/calculation-status` | JWT | ≥ USER |

---

## `/api/rows`

| Метод | Путь | Аутентификация | Доступ |
|-------|------|----------------|--------|
| GET | `/` | JWT | ≥ USER |
| GET | `/id/:id` | JWT | ≥ USER |
| GET | `/title/:title` | JWT | ≥ USER |
| POST | `/` | JWT | ≥ ADMIN |
| PUT | `/:id` | JWT | ≥ ADMIN |
| DELETE | `/:id` | JWT | ≥ PRIME |

---

## `/api/pallets`

| Метод | Путь | Аутентификация | Доступ |
|-------|------|----------------|--------|
| GET | `/` | JWT | ≥ USER |
| GET | `/empty` | JWT | ≥ USER |
| GET | `/by-row/:rowId` | JWT | ≥ USER |
| GET | `/by-title/:title` | JWT | ≥ USER |
| GET | `/:id` | JWT | ≥ USER |
| POST | `/` | JWT | ≥ EDITOR |
| POST | `/move-poses` | JWT | ≥ EDITOR |
| PUT | `/:id` | JWT | ≥ EDITOR |
| DELETE | `/:id` | JWT | ≥ PRIME |
| DELETE | `/:id/poses` | JWT | ≥ EDITOR |
| DELETE | `/:id/empty-poses` | JWT | ≥ EDITOR |

---

## `/api/pallet-groups`

| Метод | Путь | Аутентификация | Доступ |
|-------|------|----------------|--------|
| GET | `/` | JWT | ≥ ADMIN |
| GET | `/free-pallets` | JWT | ≥ ADMIN |
| GET | `/:id` | JWT | ≥ ADMIN |
| POST | `/` | JWT | ≥ ADMIN |
| PATCH | `/reorder` | JWT | ≥ ADMIN |
| PUT | `/:id` | JWT | ≥ ADMIN |
| DELETE | `/:id` | JWT | ≥ PRIME |
| POST | `/reset-pallets-sectors` | JWT | ≥ ADMIN |
| POST | `/recalculate-pallets-sectors` | JWT | ≥ ADMIN |
| POST | `/set-pallets` | JWT | ≥ ADMIN |
| POST | `/unlink-pallet` | JWT | ≥ ADMIN |

---

## `/api/poses`

| Метод | Путь | Аутентификация | Доступ |
|-------|------|----------------|--------|
| GET | `/` | JWT | ≥ USER |
| GET | `/:id` | JWT | ≥ USER |
| GET | `/by-artikul/:artikul` | JWT | ≥ USER |
| GET | `/by-pallet/:palletId` | JWT | ≥ USER |
| GET | `/by-row/:rowId` | JWT | ≥ USER |
| POST | `/` | JWT | ≥ EDITOR |
| POST | `/bulk` | JWT | ≥ EDITOR |
| POST | `/populate-missing-data` | JWT | ≥ EDITOR |
| POST | `/export-stocks` | JWT | ≥ ADMIN |
| PUT | `/:id` | JWT | ≥ ADMIN |
| DELETE | `/:id` | JWT | ≥ ADMIN |

---

## `/api/blocks`

| Метод | Путь | Аутентификация | Доступ |
|-------|------|----------------|--------|
| POST | `/` | JWT | ≥ ADMIN |
| GET | `/` | JWT | ≥ ADMIN |
| GET | `/:id` | JWT | ≥ ADMIN |
| PUT | `/:id` | JWT | ≥ ADMIN |
| PATCH | `/:id/rename` | JWT | ≥ ADMIN |
| POST | `/upsert` | JWT | ≥ PRIME |
| DELETE | `/:id` | JWT | ≥ PRIME |
| POST | `/reset-zones-sectors` | JWT | ≥ ADMIN |
| POST | `/recalculate-zones-sectors` | JWT | ≥ ADMIN |

---

## `/api/segs`

| Метод | Путь | Аутентификация | Доступ |
|-------|------|----------------|--------|
| POST | `/` | JWT | ≥ ADMIN |
| POST | `/upsert` | JWT | ≥ ADMIN |
| GET | `/` | JWT | ≥ ADMIN |
| GET | `/by-block/:blockId` | JWT | ≥ ADMIN |
| GET | `/:segId/zones` | JWT | ≥ ADMIN |
| GET | `/:id` | JWT | ≥ ADMIN |
| PUT | `/:id` | JWT | ≥ ADMIN |
| DELETE | `/:id` | JWT | ≥ ADMIN |

---

## `/api/zones`

| Метод | Путь | Аутентификация | Доступ |
|-------|------|----------------|--------|
| POST | `/` | JWT | ≥ ADMIN |
| GET | `/` | JWT | ≥ ADMIN |
| GET | `/export` | JWT | ≥ ADMIN |
| GET | `/title/:title` | JWT | ≥ ADMIN |
| GET | `/by-block/:blockId` | JWT | ≥ ADMIN |
| GET | `/:id` | JWT | ≥ ADMIN |
| PUT | `/:id` | JWT | ≥ ADMIN |
| DELETE | `/:id` | JWT | ≥ PRIME |
| POST | `/upsert` | JWT | ≥ PRIME |

---

## `/api/prods`

| Метод | Путь | Аутентификация | Доступ |
|-------|------|----------------|--------|
| GET | `/` | JWT | ≥ USER |
| GET | `/id/:id` | JWT | ≥ USER |
| GET | `/name/:name` | JWT | ≥ USER |
| POST | `/` | JWT | ≥ ADMIN |
| PATCH | `/id/:id` | JWT | ≥ ADMIN |
| DELETE | `/id/:id` | JWT | ≥ PRIME |

---

## `/api/variants`

| Метод | Путь | Аутентификация | Доступ |
|-------|------|----------------|--------|
| GET | `/` | JWT | ≥ USER |
| GET | `/id/:id` | JWT | ≥ USER |
| POST | `/` | JWT | ≥ ADMIN |
| PATCH | `/id/:id` | JWT | ≥ ADMIN |
| DELETE | `/id/:id` | JWT | ≥ PRIME |

---

## `/api/konks`

| Метод | Путь | Аутентификация | Доступ |
|-------|------|----------------|--------|
| GET | `/` | JWT | ≥ ADMIN |
| GET | `/id/:id` | JWT | ≥ ADMIN |
| GET | `/name/:name` | JWT | ≥ ADMIN |
| POST | `/` | JWT | ≥ ADMIN |
| PATCH | `/id/:id` | JWT | ≥ ADMIN |
| DELETE | `/id/:id` | JWT | ≥ PRIME |

---

## `/api/constants`

| Метод | Путь | Аутентификация | Доступ |
|-------|------|----------------|--------|
| GET | `/` | JWT | ≥ ADMIN |
| GET | `/id/:id` | JWT | ≥ ADMIN |
| GET | `/name/:name` | JWT | ≥ ADMIN |
| POST | `/` | JWT | ≥ ADMIN |
| PATCH | `/id/:id` | JWT | ≥ ADMIN |
| DELETE | `/id/:id` | JWT | ≥ PRIME |

---

## `/api/analogs`

| Метод | Путь | Аутентификация | Доступ |
|-------|------|----------------|--------|
| GET | `/id/:id/stock` | JWT | ≥ ADMIN |
| GET | `/id/:id` | JWT | ≥ ADMIN |
| GET | `/prod/:prodName` | JWT | ≥ ADMIN |
| GET | `/konk/:konkName` | JWT | ≥ ADMIN |
| GET | `/artikul/:artikul` | JWT | ≥ ADMIN |
| GET | `/` | JWT | ≥ ADMIN |
| POST | `/` | JWT | ≥ ADMIN |
| PATCH | `/id/:id` | JWT | ≥ ADMIN |
| DELETE | `/id/:id` | JWT | ≥ PRIME |

---

## `/api/analog-slices`

| Метод | Путь | Аутентификация | Доступ |
|-------|------|----------------|--------|
| GET | `/` | JWT | ≥ ADMIN |
| GET | `/analog/:analogId/range` | JWT | ≥ ADMIN |
| GET | `/analog/:analogId/sales-range` | JWT | ≥ ADMIN |
| GET | `/analog/:analogId/sales-by-date` | JWT | ≥ ADMIN |
| GET | `/analog/:analogId/comparison-excel` | JWT | ≥ ADMIN |
| GET | `/konk-btrade/sales-comparison` | JWT | ≥ ADMIN |
| GET | `/konk-btrade/stock-comparison` | JWT | ≥ ADMIN |
| GET | `/konk-btrade/comparison-excel` | JWT | ≥ ADMIN |
| GET | `/konk-btrade/sales-comparison-excel` | JWT | ≥ ADMIN |
| GET | `/analog/:analogId/sales-comparison-excel` | JWT | ≥ ADMIN |
| GET | `/analog/:analogId` | JWT | ≥ ADMIN |

---

## `/api/btrade-slices`

| Метод | Путь | Аутентификация | Доступ |
|-------|------|----------------|--------|
| GET | `/artikul/:artikul/range` | JWT | ≥ ADMIN |
| GET | `/` | JWT | ≥ ADMIN |

---

## `/api/art-sales-reports`

| Метод | Путь | Аутентификация | Доступ |
|-------|------|----------------|--------|
| GET | `/artikul/:artikul/by-date` | JWT | ≥ ADMIN |
| GET | `/artikul/:artikul/range` | JWT | ≥ ADMIN |

---

## `/api/art-chart-reports`

| Метод | Путь | Аутентификация | Доступ |
|-------|------|----------------|--------|
| GET | `/artikul/:artikul/stock` | JWT | ≥ ADMIN |
| GET | `/artikul/:artikul/sales` | JWT | ≥ ADMIN |

---

## `/api/art-excel-reports`

| Метод | Путь | Аутентификация | Доступ |
|-------|------|----------------|--------|
| GET | `/artikul/:artikul/stock` | JWT | ≥ ADMIN |
| GET | `/artikul/:artikul/sales` | JWT | ≥ ADMIN |

---

## `/api/skus`

| Метод | Путь | Аутентификация | Доступ |
|-------|------|----------------|--------|
| GET | `/` | JWT | ≥ ADMIN |
| DELETE | `/konk/:konkName/invalid` | JWT | ≥ PRIME |
| DELETE | `/not-in-any-skugr` | JWT | ≥ PRIME |
| GET | `/by-skugr/:skugrId` | JWT | ≥ ADMIN |
| GET | `/id/:id` | JWT | ≥ ADMIN |
| POST | `/` | JWT | ≥ ADMIN |
| POST | `/fix-incorrect-sku-data` | JWT | ≥ ADMIN |
| PATCH | `/id/:id` | JWT | ≥ ADMIN |
| DELETE | `/id/:id` | JWT | ≥ PRIME |

---

## `/api/skugrs`

| Метод | Путь | Аутентификация | Доступ |
|-------|------|----------------|--------|
| GET | `/` | JWT | ≥ ADMIN |
| GET | `/id/:id` | JWT | ≥ ADMIN |
| POST | `/` | JWT | ≥ ADMIN |
| POST | `/id/:id/fill-skus` | JWT | ≥ ADMIN |
| POST | `/set-is-sliced` | JWT | ≥ ADMIN |
| PATCH | `/id/:id` | JWT | ≥ ADMIN |
| POST | `/id/:id/clear-skus` | JWT | ≥ ADMIN |
| DELETE | `/id/:id/with-skus` | JWT | ≥ PRIME |
| DELETE | `/id/:id` | JWT | ≥ PRIME |

---

## `/api/sku-slices`

| Метод | Путь | Аутентификация | Доступ |
|-------|------|----------------|--------|
| GET | `/` | JWT | ≥ ADMIN |
| GET | `/sku/:skuId/range` | JWT | ≥ ADMIN |
| GET | `/sku/:skuId` | JWT | ≥ ADMIN |

---

## `/api/slice-compensation`

| Метод | Путь | Аутентификация | Доступ |
|-------|------|----------------|--------|
| POST | `/run` | JWT | ≥ ADMIN |

---

## `/api/sku-excel-reports`

| Метод | Путь | Аутентификация | Доступ |
|-------|------|----------------|--------|
| GET | `/catalog/new-since` | JWT | ≥ ADMIN |
| GET | `/catalog/invalid` | JWT | ≥ ADMIN |
| GET | `/konk/stock` | JWT | ≥ ADMIN |
| GET | `/konk/sales` | JWT | ≥ ADMIN |
| GET | `/skugr/:skugrId/stock` | JWT | ≥ ADMIN |
| GET | `/skugr/:skugrId/sales` | JWT | ≥ ADMIN |
| GET | `/sku/:skuId/stock` | JWT | ≥ ADMIN |
| GET | `/sku/:skuId/sales` | JWT | ≥ ADMIN |

---

## `/api/sku-sales-reports`

| Метод | Путь | Аутентификация | Доступ |
|-------|------|----------------|--------|
| GET | `/konk-prod/skugr-groups-sales` | JWT | ≥ ADMIN |
| GET | `/skugr/:skugrId/daily-summary` | JWT | ≥ ADMIN |
| GET | `/sku/:skuId/by-date` | JWT | ≥ ADMIN |
| GET | `/sku/:skuId/range` | JWT | ≥ ADMIN |

---

## `/api/sku-chart-reports`

| Метод | Путь | Аутентификация | Доступ |
|-------|------|----------------|--------|
| GET | `/konk-prod/manufacturers-pie` | JWT | ≥ ADMIN |
| GET | `/konk-prod/stock` | JWT | ≥ ADMIN |
| GET | `/konk-prod/sales` | JWT | ≥ ADMIN |

---

## Порядок маршрутов (poses)

В [`src/modules/poses/router.ts`](../../src/modules/poses/router.ts) объявлен маршрут `GET /:id` **раньше**, чем `GET /by-artikul/:artikul` и другие префиксы `by-*`. В Express сегмент `by-artikul` может обрабатываться как `:id`. На поведение API в продакшене это влияет при вызове путей с `by-*`; матрица отражает **задекларированные** пути в роутере.

---

## Связанные документы

- [Обзор API](index.md) — базовые пути и общие соглашения.
- Разделы по модулям в `docs/api/*.md` — форматы тел запросов и ответов там, где они описаны.
