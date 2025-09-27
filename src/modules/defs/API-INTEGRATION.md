# API Integration для статуса расчета дефицитов

## Новый endpoint для сервера

### GET `/api/defs/calculation-status`

Проверяет текущий статус выполнения расчета дефицитов.

**Запрос:**

```http
GET /api/defs/calculation-status
Authorization: Bearer <token>
```

**Ответ при успехе (200):**

```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "progress": 45,
    "estimatedTimeRemaining": 180,
    "startedAt": "2024-01-15T10:30:00.000Z",
    "lastUpdate": "2024-01-15T10:32:00.000Z"
  }
}
```

**Ответ когда процесс не запущен (200):**

```json
{
  "success": true,
  "data": {
    "isRunning": false,
    "progress": 0,
    "estimatedTimeRemaining": 0,
    "startedAt": null,
    "lastUpdate": null
  }
}
```

## Реализация на сервере

### 1. Глобальное состояние

Создайте глобальную переменную для отслеживания статуса:

```javascript
// calculationStatus.js
let calculationStatus = {
  isRunning: false,
  progress: 0,
  estimatedTimeRemaining: 0,
  startedAt: null,
  lastUpdate: null,
};

module.exports = calculationStatus;
```

### 2. Обновление статуса в процессе расчета

В контроллере `/api/defs/calculate`:

```javascript
const calculationStatus = require("./calculationStatus");

// При запуске расчета
calculationStatus.isRunning = true;
calculationStatus.progress = 0;
calculationStatus.startedAt = new Date().toISOString();
calculationStatus.lastUpdate = new Date().toISOString();

// В процессе расчета (например, каждые 10 товаров)
calculationStatus.progress = Math.round((processedItems / totalItems) * 100);
calculationStatus.estimatedTimeRemaining = calculateRemainingTime();
calculationStatus.lastUpdate = new Date().toISOString();

// При завершении
calculationStatus.isRunning = false;
calculationStatus.progress = 100;
calculationStatus.estimatedTimeRemaining = 0;
calculationStatus.lastUpdate = new Date().toISOString();
```

### 3. Новый контроллер

```javascript
// controllers/defsController.js
const calculationStatus = require("../calculationStatus");

exports.getCalculationStatus = (req, res) => {
  try {
    res.json({
      success: true,
      data: calculationStatus,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get calculation status",
      error: error.message,
    });
  }
};
```

### 4. Роут

```javascript
// routes/defs.js
const { getCalculationStatus } = require("../controllers/defsController");

router.get("/calculation-status", authenticateToken, getCalculationStatus);
```

## Использование на фронтенде

### Автоматический polling

```typescript
// В компоненте, где нужно отслеживать статус
const statusQuery = useDefsCalculationStatus();

// Включаем polling после запуска расчета
useEffect(() => {
  if (calculateMutation.isSuccess) {
    statusQuery.refetch(); // Запускаем первую проверку
    // Polling будет работать автоматически
  }
}, [calculateMutation.isSuccess]);
```

### Отображение прогресса

```typescript
// В UI компоненте
const statusData = statusQuery.data?.data;

if (statusData?.isRunning) {
  return (
    <div>
      <p>Расчет выполняется: {statusData.progress}%</p>
      <p>Осталось времени: {statusData.estimatedTimeRemaining} сек</p>
    </div>
  );
}
```

## Преимущества

1. **Реальное время**: Пользователь видит актуальный прогресс
2. **Автоматическое обновление**: Данные обновляются каждые 5 секунд
3. **Эффективность**: Polling останавливается, когда процесс завершен
4. **UX**: Пользователь понимает, что происходит

## Альтернативы

Если не хотите создавать отдельный endpoint, можно:

1. **WebSocket**: Реальное время без polling
2. **Server-Sent Events**: Простая реализация для односторонней связи
3. **Polling существующих данных**: Проверять изменения в `/api/defs/latest`

Но отдельный endpoint для статуса - самое простое и надежное решение.
