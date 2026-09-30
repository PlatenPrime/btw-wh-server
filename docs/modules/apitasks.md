# Модуль ApiTasks

## Назначение

Модуль убирает долгие action-операции (scrape срезов, compensating refetch, fill-skus, sync каталогов, массовые пересчёты и удаления) с синхронного HTTP-ответа. Раньше фронт держал запрос открытым минутами или получал «слепой» 202 без статуса. ApiTask — отложенная задача: клиент ставит её, сразу получает `taskId`, дальше смотрит прогресс на странице задач и при необходимости отменяет.

Excel-выгрузки остаются в модуле excel-jobs (файл + worker isolate). ApiTasks — I/O и batch-действия в основном процессе Node с `AbortSignal` для отмены.

## Сущности и связи

**ApiTask** — документ в Mongo: кто заказал (`userId`), какой kind, сырые/нормализованные `params`, опциональный `resourceKey` для дедупа активных задач по ресурсу, статус жизненного цикла, фаза, прогресс 0–100, человекочитаемый `message`, JSON `result` по завершении, `error`, `expiresAt`.

Связи: задача принадлежит пользователю JWT; `kind` указывает на реестр runners, который валидирует params Zod-схемами и вызывает прежние util доменных модулей (sku-slices, slice-compensation, skugrs, grabo-skus, arts, dels, pallet-groups, blocks, poses, skus). Domains не знают про HTTP постановки.

**Очередь** — in-process, один активный runner глобально. Состояние очереди в памяти, статус и прогресс — в Mongo. Рестарт во время `running` помечает задачу failed и заново ставит `queued`.

## Статусы и фазы

Статусы: `queued` → `running` → `completed` | `failed` | `cancelled`; отдельно `expired`.

Фазы для UI: `queued`, `preparing`, `running`, `finalizing`.

Прогресс — ориентир для UI. Runners шлют `onProgress(done, total, message?)`; executor мапит в полосу примерно 10–90%.

## Решения

- Без Redis/Bull: один процесс сервера, очередь в памяти, состояние в Mongo.
- Cancel: сначала статус `cancelled` в Mongo, затем abort текущего AbortController / снятие из очереди. Runner уважает `signal`.
- Дедуп по `resourceKey` (например одна skugr-run-today на группу) → 409 при активном дубле.
- Лимит активных задач на пользователя (`queued`+`running`).
- Старые доменные action-URL отвечают 410 с `kind`, чтобы фронт мигрировал по месту клика.
- Live GET (stock, browser, charts) не входят в модуль.

## Ограничения

Не больше трёх активных задач на пользователя. Глобально одновременно выполняется одна ApiTask. TTL результата `completed` — сутки, затем `expired` и очистка `result`.
