# Логирование

Модуль централизует structured logging сервера на базе Pino. Заменяет разрозненные вызовы `console.*` единым API с уровнями, JSON-форматом для Railway и политикой redaction чувствительных полей.

## Задачи

- Корреляция HTTP-запросов через `x-request-id`
- Единый формат логов cron, browser-scraping и ошибок API
- Контроль объёма логов через `LOG_LEVEL` и `LOG_HTTP`
- Исключение утечки stack trace клиенту в production

## Сущности

- **root logger** — singleton процесса, уровень и формат из env
- **child logger** — логгер с bindings (`module`, `job`, `konkName`, `requestId`)
- **logModuleError / logModuleWarn / logModuleInfo / logModuleDebug** — тонкие обёртки для модульного логирования без прямого `console.*`
- **HTTP logger** — middleware access log (pino-http)
- **slow request logger** — warn при ответе дольше 5 секунд
- **error logger** — express error handler: пишет в лог, клиенту — sanitized JSON

## Связи

- `index.ts` подключает HTTP/slow/error middleware и process handlers
- Cron-джобы и утилиты срезов создают child logger с `module` + `job`
- Browser-модуль логирует внешние HTTP-ошибки через child `module: browser`
- Telegram-уведомления cron остаются отдельным каналом (алерты, не логи)

## Env

| Переменная | Значение | По умолчанию |
|------------|----------|--------------|
| LOG_LEVEL | fatal, error, warn, info, debug, trace | info (prod), debug (dev) |
| LOG_FORMAT | json, pretty | json |
| LOG_HTTP | true/false | true |

## Redaction

Из логов маскируются: `Authorization`, cookies, `password`, `token`, `jwt`.
