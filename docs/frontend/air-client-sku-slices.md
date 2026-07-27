# Фронтенд: клиентское заполнение Air SKU-срезов

## Задача

Серверный scrape Air снова primary (impit + cron/compensation/live). Client-ingestion остаётся **параллельным** каналом: дозаполнение срезов Air SKU за **сегодня** (календарный день `Europe/Kiev`) с машины оператора, когда серверный опрос вернул missing/`-1` или нужен ручной прогон. Chrome extension открывает first-party страницу товара, frontend с JWT отправляет HTML на backend.

Расширение и frontend живут вне этого репозитория; здесь только контракт поведения.

## API

Полный формат: [`docs/api/sku-slices.md`](../api/sku-slices.md). Auth: JWT, роль ≥ ADMIN.

1. `GET /api/sku-slices/client/air/pending` — очередь `{ date, items: [{ skuId, productId, title, url }] }` для sliced Air SKU без валидной точки сегодня (missing или `stock/price === -1`). Нет документа среза = все sliced pending.
2. `PUT /api/sku-slices/client/air/sku/:skuId` — body `{ sourceUrl, html }`. Backend парсит HTML, пишет в сегодняшний `SkuSlice` только если ключ отсутствует/невалиден; иначе `status: "skipped"`.

## UX / поток

1. Кнопка «Дозаполнить Air сегодня» (ADMIN/PRIME) — рядом с live-stock / compensating slice, не вместо них.
2. Загрузить pending; показать счётчик и список (можно свёрнутый).
3. Последовательно по `items` (не параллельный шторм вкладок):
   - extension открывает `url` как обычную навигацию (first-party);
   - content script читает `document.documentElement.outerHTML`;
   - frontend делает PUT с `sourceUrl = url` и `html`;
   - показать статус строки: saved / skipped / error.
4. После 422 (невалидный HTML / «Захищена сторінка») — retry этой позиции позже или вручную; не затирать очередь целиком.
5. После серии — инвалидировать кэш `GET /api/sku-slices` за `data.date`.

## После ответа PUT

| Статус | UI |
|--------|-----|
| 200 `saved` | Точка записана; убрать из локальной pending-очереди |
| 200 `skipped` | Уже было валидное значение; не ошибка |
| 400 `URL_MISMATCH` / `NOT_AIR` / `NOT_SLICED` | Toast + код; проверить карточку SKU / группу |
| 404 | SKU удалён |
| 422 | HTML без stock/price (WAF/другая вёрстка); retry |
| 401/403 | Стандартная сессия/права |

## Не делать

- Не `fetch(airUrl)` из SPA ради HTML для PUT — WAF/CORS могут блокировать; для HTML используйте extension first-party.
- Не слать JWT в расширение: HTML возвращается на страницу приложения, PUT делает frontend.
- Не перезаписывать валидные точки повторным PUT — backend уже идемпотентен.
- Не подменять этим каналом `GET /api/skus/id/:id/stock` (live) и `POST /api/slice-compensation/run` — они снова работают для air на сервере.
