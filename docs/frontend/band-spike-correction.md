# Фронтенд: ручная корректировка band-spike

## Задача

У конкурентов периодически появляются фейковые всплески остатка: короткий период «адекватно → аномально высокий уровень → снова адекватно» (миллионы у svbum, тысячи у balun и т.п.). Диапазоны плавают — хардкодить их на бэке больше нельзя.

Авто-коррекции после срезов **отключены**. Админ сам задаёт полосу остатка и даты, находит кандидатов и правит **по одному SKU** (preview → confirm). Nightly post-pass трогает только pack-flip `perfect` и manufacturer rollup.

## Два входа

1. **Страница корректировок** — discovery по конкуренту и полосе, таблица кандидатов, затем точечная правка выбранного SKU.
2. **Карточка SKU** — тот же corrector с полями `stockMin` / `stockMax` и датами (раньше band-spike был только у balun и без выбора полосы).

Auth везде: JWT, роль ≥ ADMIN.

---

## Страница: discovery → выбор → correct

### 1. Поиск кандидатов

- Метод/путь: `POST /api/sku-slices/band-spike/discover`
- Body: `{ konkName, stockMin, stockMax, dateFrom, dateTo }`
- Лимит окна: **93** дня
- Ответ: `data.items[]` — `skuId` (может быть `null`), `productId`, `title`, `imageUrl` (может быть `null`), `runs[]` (`dateFrom`, `dateTo`, `peakStock`)

Кандидат = в окне был contiguous run в `[stockMin, stockMax]`, и **после** него день с finite stock **вне** полосы. Trailing plateau без выхода из полосы в список не попадает. Entry слева не обязателен.

Массового apply нет — только список для ручного выбора.

### UX discovery

1. Выбор конкурента, min/max остатка, период.
2. Submit → таблица кандидатов (сортировка по `productId` с бэка).
3. Клик по строке → переход к карточке / модалке correct с предзаполненными `stockMin`/`stockMax` и датами run (или всего окна поиска).

Ориентиры полос (подсказки UI, не серверные константы): svbum часто миллионы; balun — около 5k / 9–11k. Пользователь всегда вводит числа сам.

### 2. Preview / apply одного SKU

- Метод/путь: `POST /api/sku-slices/sku/:skuId/correct-band-spike`
- Body: `{ dateFrom, dateTo, stockMin, stockMax, apply? }` (`apply` default `false`)
- Лимит окна: **366** дней
- Любой конкурент SKU (нужны `konkName` + `productId`)

Алгоритм: sandwich `stock < stockMin` → дни в `[stockMin, stockMax]` → снова `stock < stockMin`. Якорь справа; внутри полосы продажи LTR сохраняются (ход RTL). Dump последнего band-дня в «маленький» остаток в продажи не входит. Соседи ±1 дня подгружаются на сервере.

`skipped.reason`: `missing-left` | `missing-right` | `not-sandwich-left` | `not-sandwich-right`.

### UX correct

1. Показать preview (`apply: false`) — таблица `patches` (`date`, `from`, `to`) и `skipped`.
2. Confirm → тот же запрос с `apply: true`.
3. После успеха — инвалидировать график «Динаміка залишків» / range / sales за затронутый период.

Не запускать apply без явного подтверждения после просмотра patches.

---

## Карточка SKU

Тот же `POST .../correct-band-spike`. Рядом с «Виправити зріз» — действие вроде «Виправити band-spike» с полями периода и min/max остатка.

Подходит для любого `konkName`, не только balun.

---

## Не путать с

- `PATCH /api/sku-slices/sku/:skuId` — один stock/price на весь диапазон без RTL-динамики;
- `POST /api/sku-slices/post-corrections/run` — только pack-flip + rollup, **без** band-spike и без массовой правки всплесков;
- `GET /api/sku-slices/pack-flips` — кратность упаковок (perfect), другая механика.

---

## Ограничения

- «Небольшое» для sandwich = finite stock `< stockMin`, не `-1`.
- Discovery без exit ≠ correctable sandwich: в списке могут быть SKU, у которых correct вернёт только `skipped` — админ смотрит preview.
- Период и полосу выбирает человек; сервер не подставляет дефолтные min/max.
