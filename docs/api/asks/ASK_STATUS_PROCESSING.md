# Статус `processing` для Ask

## Описание

Добавлен новый статус `processing` для модели Ask. Этот статус указывает, что по запросу уже было выполнено снятие товара (создан event с типом `pull`), но запрос еще не был намеренно завершен (не переведен в статус `completed`).

## Когда устанавливается статус

Статус `processing` устанавливается **автоматически** при любом снятии товара по запросу (вызов API `POST /asks/:id/pull`), если текущий статус запроса не является `completed` или `rejected`.

**Логика установки:**
- Если статус ask = `"completed"` или `"rejected"` → статус остается без изменений
- Если статус ask = `"new"` или `"processing"` → статус устанавливается в `"processing"`

## Возможные статусы Ask

```typescript
type AskStatus = "new" | "processing" | "completed" | "rejected";
```

## Переходы статусов

```
new → processing (при первом снятии)
processing → processing (при последующих снятиях)
processing → completed (при намеренном завершении)
processing → rejected (при отклонении)
new → completed (возможно, если завершен без снятий)
new → rejected (при отклонении)
```

## Влияние на API

### 1. Модель Ask

Все эндпоинты, возвращающие объект Ask, теперь могут содержать статус `"processing"`:

```typescript
{
  _id: string;
  artikul: string;
  status: "new" | "processing" | "completed" | "rejected";
  // ... остальные поля
}
```

**Затронутые эндпоинты:**
- `GET /asks/:id` - получение ask по ID
- `POST /asks/:id/pull` - снятие по ask (возвращает обновленный ask со статусом `processing`)
- `GET /asks/by-date/:date` - получение asks за дату
- Любые другие эндпоинты, возвращающие объекты Ask

### 2. Статистика

Эндпоинт `GET /asks/by-date/:date` теперь возвращает дополнительное поле `processingCount`:

```typescript
{
  asks: IAsk[];
  statistics: {
    newCount: number;
    processingCount: number; // ← новое поле
    completedCount: number;
    rejectedCount: number;
  };
}
```

## Рекомендации для фронтенда

1. **Отображение статуса**: Добавьте обработку статуса `"processing"` в UI компонентах, отображающих статусы asks
2. **Фильтрация**: Учитывайте статус `"processing"` при фильтрации и поиске asks
3. **Статистика**: Отображайте `processingCount` в статистике, если она показывается пользователю
4. **Визуализация**: Статус `"processing"` логически находится между `"new"` и `"completed"` - запрос в процессе выполнения

## Примеры

### Пример 1: Создание и первое снятие

```json
// 1. Создан ask со статусом "new"
POST /asks
{
  "status": "new"
}

// 2. Выполнено первое снятие
POST /asks/:id/pull
{
  "status": "processing" // ← автоматически установлен
}
```

### Пример 2: Получение статистики

```json
GET /asks/by-date/2025-01-15
{
  "asks": [...],
  "statistics": {
    "newCount": 5,
    "processingCount": 3, // ← новое поле
    "completedCount": 10,
    "rejectedCount": 2
  }
}
```

