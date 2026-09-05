# Фронтенд: клиентский refill товарных групп Air

## Задача

Серверный crawl листингов Air выключен тем же `AIR_IDLE_MODE`, что и срезы: weekly cron пропускает air-группы, `POST /api/skugrs/id/:id/fill-skus` для air отвечает `CLIENT_INGEST_REQUIRED`. Каталог групп нужно обновлять с машины оператора: first-party вкладка airballoons.com.ua, HTML на backend, тот же apply, что у серверного fill (create/link/`newsku`).

Unpacked-расширение в этом репозитории: [`chrome-extensions/air-skugr-fill`](../../chrome-extensions/air-skugr-fill). Сборка не нужна.

## API

Полный формат: [`docs/api/skugrs.md`](../api/skugrs.md). Auth: JWT, роль ≥ ADMIN.

1. `GET /api/skugrs/client/air/pending` — `{ items: [{ skugrId, title, url, prodName }] }` по всем Air-группам с непустым `url`.
2. `POST /api/skugrs/client/air/id/:id/fill-page` — body `{ sourceUrl, pageUrl, html }`. Backend парсит карточки, аддитивно пишет в группу, отдаёт `{ stats, nextPageUrl, productsOnPage }`.

## Расширение

1. Chrome → `chrome://extensions` → Developer mode → Load unpacked → папка `chrome-extensions/air-skugr-fill`.
2. В popup: API base (без хвоста `/api`), JWT из логина ADMIN/PRIME. Токен в `chrome.storage.local`, в git не класть.
3. Start: очередь pending → для каждой группы открывает `url`, снимает `outerHTML`, POST fill-page, следует `nextPageUrl`, пока не `null`.
4. Stop прерывает очередь после текущей страницы.
5. 422 (WAF/пустая вёрстка) — retry этой страницы; не сбрасывать всю очередь.

## После ответа fill-page

| Статус | UI |
|--------|----|
| 200 | страница применена; если `nextPageUrl` есть — следующая страница той же группы |
| 400 `URL_MISMATCH` / `PAGE_URL_MISMATCH` / `NOT_AIR` | лог + код; проверить `skugr.url` |
| 404 | группа удалена; пропуск |
| 422 | HTML без сетки листинга; retry |
| 401/403 | сессия/права |

## Не делать

- Не `fetch` HTML листинга Air из popup/страницы приложения — только first-party вкладка.
- Не звать серверный `POST /api/skugrs/id/:id/fill-skus` для air, пока idle включён.
- Не слать параллельный шторм вкладок.
