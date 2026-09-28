# Фронтенд: конкурент dojdevik (Ваш Комфорт / Prom.ua)

## Задача

Подключить витрину dojdevik.com.ua (company site Prom.ua) как обычного конкурента: Konk → группы листинга → SKU → live остаток/цена и ежедневные SKU-срезы. Клиентского ingest (как у Air) нет: fill групп и stock идут с сервера.

Концепции бэкенда: [browser](../modules/browser.md) (слой `promua/`), [skugrs](../modules/skugrs.md), [sku-live-stock](sku-live-stock.md).

## Konk

В справочнике конкурентов `name` должен быть **`dojdevik`** (бэкенд нормализует регистр). Другое имя не попадёт в stock-геттер и в `fill-skus`.

## Группы (Skugr)

`url` группы — URL **листинга категории** на dojdevik.com.ua, не карточки товара. Query с фильтрами Prom (если есть) нужно сохранять: пагинация `rel=next` иногда их выкидывает, сервер мержит с исходного `groupUrl`.

Создание/правка: `POST /api/skugrs`, `PATCH /api/skugrs/id/:id`. Чтобы группа участвовала в ночных SKU-срезах — `isSliced: true`.

## Наполнение SKU

Серверный обход: `POST /api/skugrs/id/:id/fill-skus` (JWT, роль ≥ ADMIN). Опционально `maxPages` 1–200. Cron fill групп ходит тем же путём.

Ответ — обновлённый Skugr + `stats` (fetched / created / linked / skip). Полный контракт: [`docs/api/skugrs.md`](../api/skugrs.md).

Новые SKU получают `productId` вида `dojdevik-<promProductId>` (`data-product-id` с карточки листинга), `title` / `url` / `imageUrl` с листинга. Повторный fill аддитивен.

Пустой состав без удаления SKU: `POST /api/skugrs/id/:id/clear-skus`, затем снова fill.

## Live остаток и цена

Те же эндпоинты, что у других конкурентов:

- SKU: `GET /api/skus/id/:id/stock` — UX в [sku-live-stock](sku-live-stock.md)
- Analog: `GET /api/analogs/id/:id/stock`

`stock` — штуки (упаковки с клампа корзины × размер упаковки), `price` — гривны за штуку (цена упаковки / N, 2 знака). Размер упаковки берётся из характеристики с «кількість» в названии (значение `attribute_value`) или из текста «Кількість в упаковці N шт» на карточке. **404 не равен остатку 0**: это «страница/данные недоступны», в том числе внутренняя пара `-1/-1`.

Таймаут UI — секунды (иногда десятки): scrape + 2 GraphQL к корзине Prom, не чтение среза.

## Срезы

| Канал | dojdevik |
|--------|----------|
| Ежедневный SKU-срез (20:00 Kyiv) | Да, автоматически, если есть SKU с `konkName=dojdevik` в sliced-группах |
| Компенсация SKU (`-1/-1`) | Да (dojdevik не в exclude) |
| Live analog | Да |
| Ежедневный analog-срез | Нет: `ANALOG_SLICE_KONK_NAMES` без dojdevik. Графики analog-slices для этих аналогов пустые, пока cron не расширят |

Не подменять live-кнопку чтением `GET /api/sku-slices/...`.

## Не делать

- Не ставить URL карточки товара в `url` группы.
- Не звать `fill-skus` / live-stock пачкой по всему каталогу без нужды: каждый вызов — HTTP на витрину + GraphQL корзины.
- Не трактовать 404 live-stock как «нет в наличии».
- Не ждать analog-slices и analog sales/comparison по dojdevik — дневного analog-cron нет.
- Не делать client-ingest / Chrome-расширение по образцу Air: серверный путь включён.
