# Air Skugr Fill (Chrome unpacked)

Клиентский refill товарных групп Air. Сборки нет — копируй папку на клиент как есть.

Контракт API: `docs/frontend/air-client-skugr-fill.md`.

## Установка

1. Скопируй каталог `chrome-extensions/air-skugr-fill` на клиентскую машину.
2. Chrome → `chrome://extensions` → Developer mode → Load unpacked → эта папка.
3. В popup укажи API origin (без `/api`, например `http://localhost:3232` или прод-хост) и JWT роли ADMIN/PRIME (логин `/api/auth/login`, поле токена без `Bearer `).
4. Save → Start. Stop прерывает очередь после текущей страницы.

JWT лежит в `chrome.storage.local`. В git и в копию папки токен не клади.

## Поведение

- `GET /api/skugrs/client/air/pending`
- Для каждой группы открывает first-party вкладку `airballoons.com.ua`
- Снимает `document.documentElement.outerHTML`
- `POST /api/skugrs/client/air/id/:id/fill-page`
- Идёт по `nextPageUrl`, пока не `null`
- Jitter между страницами 2–4 s, между группами 10–20 s (крутилки в popup)

422 — один retry страницы. 401/403 — стоп.
