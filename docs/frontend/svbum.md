# Фронтенд: конкурент svbum (СвятоБум)

## Задача

Подключить витрину sviatobum.ua как обычного конкурента: Konk → группы листинга → SKU → live остаток/цена и ежедневные SKU-срезы. Клиентского ingest (как у Air) нет: fill групп и stock идут с сервера.

Концепции бэкенда: [browser](../modules/browser.md), [skugrs](../modules/skugrs.md), [sku-live-stock](sku-live-stock.md).

## Konk

В справочнике конкурентов `name` должен быть **`svbum`** (бэкенд нормализует регистр). Другое имя не попадёт в stock-геттер и в `fill-skus`.

## Группы (Skugr)

`url` группы — URL **листинга категории или фильтра** на sviatobum.ua, не карточки товара. Фильтры OpenCart живут в query (`ocf=...`): его нельзя вычищать при сохранении/копировании ссылки. Без `ocf` fill обойдёт весь раздел, а не выбранную подборку.

Создание/правка: `POST /api/skugrs`, `PATCH /api/skugrs/id/:id`. Чтобы группа участвовала в ночных SKU-срезах — `isSliced: true`.

## Наполнение SKU

Серверный обход: `POST /api/skugrs/id/:id/fill-skus` (JWT, роль ≥ ADMIN). Опционально `maxPages` 1–200. Cron fill групп ходит тем же путём.

Ответ — обновлённый Skugr + `stats` (fetched / created / linked / skip). Полный контракт: [`docs/api/skugrs.md`](../api/skugrs.md).

Новые SKU получают `productId` вида `svbum-<opencartId>` (`data-p_id` с карточки листинга), `title` / `url` / `imageUrl` с листинга. Повторный fill аддитивен: уже существующие по `url` карточки линкуются в группу, поля обычно не перезаписываются (кроме промоута `newsku`).

Пустой состав без удаления SKU: `POST /api/skugrs/id/:id/clear-skus`, затем снова fill.

## Live остаток и цена

Те же эндпоинты, что у других конкурентов:

- SKU: `GET /api/skus/id/:id/stock` — UX в [sku-live-stock](sku-live-stock.md)
- Analog: `GET /api/analogs/id/:id/stock`

`stock` — штуки, `price` — гривны за штуку. Если на карточке есть фасовки (`упаковка (Nшт)`), бэкенд сводит варианты к цене за штуку и суммарному остатку в штуках. **404 не равен остатку 0**: это «страница/данные недоступны», в том числе внутренняя пара `-1/-1`.

Таймаут UI — секунды (иногда десятки): scrape, не чтение среза.

## Срезы

| Канал | svbum |
|--------|--------|
| Ежедневный SKU-срез (20:00 Kyiv) | Да, автоматически, если есть SKU с `konkName=svbum` в sliced-группах |
| Компенсация SKU (`-1/-1`) | Да (svbum не в exclude) |
| Live analog | Да |
| Ежедневный analog-срез | Нет: `ANALOG_SLICE_KONK_NAMES` без svbum. Графики analog-slices для этих аналогов пустые, пока cron не расширят |

Не подменять live-кнопку чтением `GET /api/sku-slices/...`.

## Не делать

- Не резать query у `Skugr.url` (`ocf` и прочее).
- Не ставить URL карточки товара в `url` группы.
- Не звать `fill-skus` / live-stock пачкой по всему каталогу без нужды: каждый вызов — HTTP на витрину.
- Не трактовать 404 live-stock как «нет в наличии».
- Не ждать analog-slices и analog sales/comparison по svbum — дневного analog-cron нет.
- Не делать client-ingest / Chrome-расширение по образцу Air: серверный путь включён.
