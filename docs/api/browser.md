# API модуля browser (скрапинг витрин)

Прямые запросы остатка и цены по URL страницы товара у конкурента. Без отдельной роли в этом файле: фактический доступ определяется тем, как эндпоинт подключён в общем роутере приложения.

## Эндпоинты

### GET `/api/browser/yumi/stock`

**Запрос:** query `link` — полный URL страницы товара на сайте Yumi.

**Ответ 200:** `{ message: string, data: { stock: number, price: number, title?: string } }`.

**Ответ 404:** `{ message: string }` — товар не найден или данные недоступны (в т.ч. внутренняя сентинельная пара `stock: -1`, `price: -1`).

**Ответ 400:** `{ message: string, errors: ... }` — ошибка валидации `link` (Zod).

---

### GET `/api/browser/yumin/stock`

**Запрос:** query `link` — полный URL страницы товара на сайте с вёрсткой Yumin (совместимой с сохранёнными фикстурами модуля).

**Ответ 200:** `{ message: string, data: { stock: number, price: number, title?: string } }`.

**Ответ 404:** `{ message: string }` — товар не найден или данные недоступны (`stock: -1`, `price: -1`).

**Ответ 400:** `{ message: string, errors: ... }` — ошибка валидации `link` (Zod).
