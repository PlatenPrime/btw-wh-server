# Добавление обработки коробок в модуль Pulls

## Краткое описание

В модуле pulls добавлена полная поддержка поля `boxes` (коробки) при обработке позиций. Теперь фронтенд передаёт количество коробок, а бэкенд обновляет их и записывает в actions.

## Что изменилось

### 1. Интерфейсы данных

#### IPullPosition
Добавлено поле:
```typescript
currentBoxes: number; // Текущее количество коробок на позиции
```

#### IProcessPullPositionRequest
Добавлено поле:
```typescript
actualBoxes: number; // Количество снятых коробок
```

### 2. API изменения

#### PATCH /api/pulls/:palletId/positions/:posId

**Запрос:**
```json
{
  "askId": "...",
  "actualQuant": 10,
  "actualBoxes": 2,    // ← НОВОЕ
  "solverId": "..."
}
```

**Валидация:**
- `actualBoxes` должен быть целым числом ≥ 0
- `actualBoxes` не может превышать `position.boxes`

**Ответ:** без изменений

**Ошибки:**
- `422` - если `actualBoxes > position.boxes` (новый кейс)

### 3. Формат записи в actions

**Было:**
```
"2024-01-01 12:00:00 Иван Иванов: знято 10 шт. з паллети Pallet-1"
```

**Стало:**
```
"2024-01-01 12:00:00 Иван Иванов: знято 10 шт. (2 кор.) з паллети Pallet-1"
```

### 4. Обновление позиции

Теперь обновляются оба поля атомарно:
- `quant = quant - actualQuant`
- `boxes = boxes - actualBoxes`

### 5. Валидация

Добавлены проверки:
- Перед транзакцией: `actualBoxes <= position.boxes`
- После расчёта: `newBoxes >= 0`

## Миграция для фронтенда

### Изменения в коде

#### 1. Отображение коробок

```typescript
// Теперь в IPullPosition есть currentBoxes
const position: IPullPosition = {
  posId: "...",
  artikul: "...",
  currentQuant: 100,
  currentBoxes: 10,  // ← Используй это для отображения
  requestedQuant: 50,
  // ...
};

// В UI
<div>
  Товар: {position.currentQuant} шт.
  Коробок: {position.currentBoxes}
</div>
```

#### 2. Отправка запроса

```typescript
// ОБЯЗАТЕЛЬНО передавай actualBoxes
await processPullPosition.mutateAsync({
  palletId: "...",
  posId: position.posId,
  askId: position.askId,
  actualQuant: userEnteredQuant,
  actualBoxes: userEnteredBoxes,  // ← НОВОЕ поле
  solverId: currentUser.id,
});
```

#### 3. Валидация на фронтенде

```typescript
const handleProcessPosition = () => {
  // Проверки
  if (actualQuant > position.currentQuant) {
    showError("Нельзя взять больше товара чем есть");
    return;
  }
  
  if (actualBoxes > position.currentBoxes) {
    showError("Нельзя взять больше коробок чем есть");
    return;
  }
  
  // Отправка
  processPullPosition.mutate({ ... });
};
```

## Примеры использования

### Пример 1: Простая обработка

```typescript
const processPosition = useProcessPullPosition();

await processPosition.mutateAsync({
  palletId: "6648a1b2c3d4e5f6a7b8c9d0",
  posId: "6648a1b2c3d4e5f6a7b8c9d1",
  askId: "6648a1b2c3d4e5f6a7b8c9d2",
  actualQuant: 10,
  actualBoxes: 1,
  solverId: "6648a1b2c3d4e5f6a7b8c9d3",
});
```

### Пример 2: UI компонент

```typescript
const PositionCard = ({ position }: { position: IPullPosition }) => {
  const [actualQuant, setActualQuant] = useState(0);
  const [actualBoxes, setActualBoxes] = useState(0);
  const processPosition = useProcessPullPosition();
  
  const handleSubmit = () => {
    if (actualQuant > position.currentQuant) {
      alert("Слишком много товара");
      return;
    }
    
    if (actualBoxes > position.currentBoxes) {
      alert("Слишком много коробок");
      return;
    }
    
    processPosition.mutate({
      palletId: position.palletId,
      posId: position.posId,
      askId: position.askId,
      actualQuant,
      actualBoxes,  // ← Передаём коробки
      solverId: currentUser.id,
    });
  };
  
  return (
    <div>
      <p>Доступно: {position.currentQuant} шт. / {position.currentBoxes} кор.</p>
      
      <input
        type="number"
        value={actualQuant}
        onChange={(e) => setActualQuant(Number(e.target.value))}
        max={position.currentQuant}
        placeholder="Количество товара"
      />
      
      <input
        type="number"
        value={actualBoxes}
        onChange={(e) => setActualBoxes(Number(e.target.value))}
        max={position.currentBoxes}
        placeholder="Количество коробок"
      />
      
      <button onClick={handleSubmit}>Обработать</button>
    </div>
  );
};
```

## Обратная совместимость

⚠️ **Breaking change**: Запрос без поля `actualBoxes` теперь вернёт ошибку валидации `400`.

Если фронтенд отправляет запрос без `actualBoxes`, необходимо добавить это поле.

## Тестирование

Все тесты обновлены. Добавлены проверки:
- Успешная обработка с коробками
- Валидация превышения коробок
- Формат записи в actions

## Технические детали

- Обновление позиции выполняется атомарно в транзакции MongoDB
- Валидация происходит до и после расчёта новых значений
- Формат action сохраняет обратную совместимость парсинга для `actualQuant`

