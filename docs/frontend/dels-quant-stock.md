# Dels: quant и stock (breaking changes)

## Суть

В `Del.artikuls` поле **`quantity` удалено**. Вместо него:

| Поле | Смысл | Откуда |
|------|--------|--------|
| `quant` | Количество **в поставке** | Клиент при `POST /api/dels` |
| `stock` | Остаток на **sharik.ua** | `PATCH .../artikuls/:artikul`, `POST .../artikuls/update-all` |
| `nameukr` | Название | arts при создании, sharik при sync |

До первого sharik-sync поле `stock` может отсутствовать.

## POST `/api/dels` — тело запроса

**Было:** `artikuls: Record<string, number>` (артикул → число).

**Стало:** `artikuls: Array<{ artikul: string, quantity: number }>`.

- `quantity` в теле запроса → `quant` в ответе/документе.
- Пустой массив `[]` или отсутствие поля (default `[]`).
- Дубликаты `artikul` в массиве — 400.

## Ответы GET/POST/PATCH (полный Del)

**Было:** `artikuls["ART-1"] = { quantity: 15, nameukr?: string }`.

**Стало:** `artikuls["ART-1"] = { quant: 10, stock?: 15, nameukr?: string }`.

- `quant` — то, что пользователь указал при создании поставки.
- `stock` — остаток sharik после sync; до sync может не быть.

## Sharik sync (URL без изменений)

- `PATCH /api/dels/:id/artikuls/:artikul` — обновляет `stock` и `nameukr`, **не трогает `quant`**.
- `POST /api/dels/:id/artikuls/update-all` — то же для всех артикулов (202, фон).

Новый артикул через PATCH (не был в поставке): `quant: 0`, `stock` из sharik.

## UI

- Колонка «в поставке» → `quant`.
- Колонка «остаток sharik» → `stock` (показывать прочерк/кнопку sync, если нет).
- Не читать `quantity` в ответах — поля больше нет.

## Миграция данных на бэке

Старые документы: `quantity` (sharik) → `stock`, `quant = 0`. Скрипт на сервере: `npx tsx src/modules/dels/scripts/runMigrateDelArtikulsQuantStock.ts` (нужен `MONGODB_URI`).
