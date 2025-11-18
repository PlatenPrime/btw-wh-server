# Update BtradeStock and Export Arts API

## Endpoints

### 1. Update BtradeStock for Single Art

#### Endpoint

```
PATCH /api/arts/:artikul/btrade-stock
```

#### Описание

Обновляет btradeStock для одного артикула данными с сайта sharik.ua. Получает количество товара (quantity) с sharik.ua и сохраняет его в поле `btradeStock.value`, а также устанавливает текущую дату в `btradeStock.date`.

#### Параметры пути

| Параметр  | Тип    | Обязательный | Описание       |
| --------- | ------ | ------------ | -------------- |
| `artikul` | string | Да           | Артикул товара |

#### Успешный ответ

**Статус:** `200 OK`

**Тело ответа:**

```json
{
  "message": "BtradeStock updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "artikul": "ART001",
    "nameukr": "Назва товару",
    "namerus": "Название товара",
    "zone": "A1",
    "limit": 100,
    "marker": "MARKER1",
    "btradeStock": {
      "value": 75,
      "date": "2024-01-15T10:30:00.000Z"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Ошибки

**400 Bad Request - Ошибка валидации**

```json
{
  "message": "Validation error",
  "errors": [
    {
      "code": "invalid_type",
      "path": ["artikul"],
      "message": "artikul must be a string"
    }
  ]
}
```

**404 Not Found - Артикул не найден**

```json
{
  "message": "Art not found or product not found on sharik.ua"
}
```

**500 Internal Server Error**

```json
{
  "message": "Server error",
  "error": "..." // только в development режиме
}
```

---

### 2. Update BtradeStock for All Arts

#### Endpoint

```
POST /api/arts/btrade-stock/update-all
```

#### Описание

Запускает процесс обновления btradeStock для всех артикулов в базе данных данными с сайта sharik.ua. Процесс выполняется асинхронно в фоне, сервер сразу возвращает ответ клиенту, не дожидаясь завершения. Использует очередность с задержкой 100ms между запросами, чтобы не перегрузить сервер sharik.ua.

**Важно:** Процесс обновления выполняется в фоне. Клиент получает ответ сразу после запуска процесса, не дожидаясь его завершения. Прогресс выполнения можно отслеживать в логах сервера.

#### Тело запроса

Не требуется (пустое тело)

#### Успешный ответ

**Статус:** `202 Accepted`

**Тело ответа:**

```json
{
  "message": "BtradeStock update process started"
}
```

**Примечание:** Процесс обновления продолжает выполняться в фоне после отправки ответа клиенту. Результаты обновления сохраняются в базе данных, но статистика выполнения не возвращается клиенту.

#### Ошибки

**500 Internal Server Error**

```json
{
  "message": "Server error",
  "error": "..." // только в development режиме
}
```

---

### 3. Export Arts to Excel

#### Endpoint

```
GET /api/arts/export
```

#### Описание

Экспортирует все артикулы из базы данных в Excel файл. Файл содержит все поля модели Art, включая btradeStock.

#### Успешный ответ

**Статус:** `200 OK`

**Заголовки:**

- `Content-Type`: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition`: `attachment; filename="arts_export_YYYY-MM-DD.xlsx"`
- `Content-Length`: размер файла в байтах

**Тело ответа:** Буфер Excel файла

#### Структура Excel файла

Файл содержит следующие колонки:

| Колонка           | Описание                     |
| ----------------- | ---------------------------- |
| Артикул           | Артикул товара               |
| Название (укр)    | Название на украинском       |
| Название (рус)    | Название на русском          |
| Зона              | Зона хранения                |
| Лимит             | Лимит товара                 |
| Маркер            | Маркер товара                |
| Btrade Stock      | Количество на btrade         |
| Дата Btrade Stock | Дата обновления btrade stock |
| Дата создания     | Дата создания записи         |
| Дата обновления   | Дата последнего обновления   |

#### Ошибки

**404 Not Found - Артикулы не найдены**

```json
{
  "message": "No arts found to export"
}
```

**500 Internal Server Error**

```json
{
  "message": "Server error",
  "error": "..." // только в development режиме
}
```

---

### 4. Export Arts to Excel with Stocks

#### Endpoint

```
GET /api/arts/export-with-stocks
```

#### Описание

Экспортирует все артикулы из базы данных в Excel файл с дополнительными данными о запасах и витрине. Файл содержит все поля модели Art, а также рассчитанные значения:

- **Запасы**: сумма количества товара (`quant`) из всех позиций (`Pos`) для каждого артикула
- **Витрина**: разница между `btradeStock.value` и Запасами

**Важно:**

- Если у артикула нет позиций в базе данных, значение "Запасы" будет равно `0`
- Если у артикула нет `btradeStock.value`, значение "Витрина" рассчитывается как `0 - Запасы`

#### Успешный ответ

**Статус:** `200 OK`

**Заголовки:**

- `Content-Type`: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition`: `attachment; filename="arts_export_with_stocks_YYYY-MM-DD.xlsx"`
- `Content-Length`: размер файла в байтах

**Тело ответа:** Буфер Excel файла

#### Структура Excel файла

Файл содержит следующие колонки:

| Колонка           | Описание                                                         |
| ----------------- | ---------------------------------------------------------------- |
| Артикул           | Артикул товара                                                   |
| Название (укр)    | Название на украинском                                           |
| Название (рус)    | Название на русском                                              |
| Зона              | Зона хранения                                                    |
| Лимит             | Лимит товара                                                     |
| Маркер            | Маркер товара                                                    |
| Btrade Stock      | Количество на btrade                                             |
| Дата Btrade Stock | Дата обновления btrade stock                                     |
| **Запасы**        | **Сумма количества товара из всех позиций (Pos)**                |
| **Витрина**       | **Разница между Btrade Stock и Запасами (btradeStock - Запасы)** |
| Дата создания     | Дата создания записи                                             |
| Дата обновления   | Дата последнего обновления                                       |

#### Ошибки

**404 Not Found - Артикулы не найдены**

```json
{
  "message": "No arts found to export"
}
```

**500 Internal Server Error**

```json
{
  "message": "Server error",
  "error": "..." // только в development режиме
}
```

---

## Требования к аутентификации

Все эндпоинты требуют:

- Аутентификации через JWT токен
- Роли `ADMIN` или выше
- Токен должен быть передан в заголовке `Authorization: Bearer <token>`

---

## Примеры использования

### 1. Обновить btradeStock для одного артикула

#### Fetch API

```typescript
const updateBtradeStock = async (artikul: string) => {
  const token = localStorage.getItem("authToken");

  const response = await fetch(`/api/arts/${artikul}/btrade-stock`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update btradeStock");
  }

  return await response.json();
};

// Использование
const result = await updateBtradeStock("ART001");
console.log(result.data.btradeStock);
```

#### Axios

```typescript
import axios from "axios";

const updateBtradeStock = async (artikul: string) => {
  const token = localStorage.getItem("authToken");

  const response = await axios.patch(
    `/api/arts/${artikul}/btrade-stock`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// Использование
const result = await updateBtradeStock("ART001");
```

### 2. Обновить btradeStock для всех артикулов

#### Fetch API

```typescript
const updateAllBtradeStocks = async () => {
  const token = localStorage.getItem("authToken");

  const response = await fetch("/api/arts/btrade-stock/update-all", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to start btradeStock update");
  }

  const result = await response.json();
  console.log(result.message); // "BtradeStock update process started"
  // Процесс выполняется в фоне, клиент не ждет завершения
};

// Использование
await updateAllBtradeStocks();
console.log("Процесс обновления запущен");
```

#### Axios

```typescript
import axios from "axios";

const updateAllBtradeStocks = async () => {
  const token = localStorage.getItem("authToken");

  const response = await axios.post(
    "/api/arts/btrade-stock/update-all",
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  console.log(response.data.message); // "BtradeStock update process started"
  // Процесс выполняется в фоне, клиент не ждет завершения
};

// Использование
await updateAllBtradeStocks();
```

### 3. Экспортировать артикулы в Excel

#### Fetch API

```typescript
const exportArtsToExcel = async () => {
  const token = localStorage.getItem("authToken");

  const response = await fetch("/api/arts/export", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to export arts");
  }

  // Получаем имя файла из заголовка
  const contentDisposition = response.headers.get("Content-Disposition");
  const fileName = contentDisposition
    ? contentDisposition.split("filename=")[1].replace(/"/g, "")
    : `arts_export_${new Date().toISOString().split("T")[0]}.xlsx`;

  // Создаем blob и скачиваем файл
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

// Использование
await exportArtsToExcel();
```

#### Axios

```typescript
import axios from "axios";

const exportArtsToExcel = async () => {
  const token = localStorage.getItem("authToken");

  const response = await axios.get("/api/arts/export", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    responseType: "blob", // Важно указать blob для бинарных данных
  });

  // Получаем имя файла из заголовка
  const contentDisposition = response.headers["content-disposition"];
  const fileName = contentDisposition
    ? contentDisposition.split("filename=")[1].replace(/"/g, "")
    : `arts_export_${new Date().toISOString().split("T")[0]}.xlsx`;

  // Создаем blob и скачиваем файл
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

// Использование
await exportArtsToExcel();
```

### 4. Экспортировать артикулы в Excel с данными о запасах и витрине

#### Fetch API

```typescript
const exportArtsToExcelWithStocks = async () => {
  const token = localStorage.getItem("authToken");

  const response = await fetch("/api/arts/export-with-stocks", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to export arts with stocks");
  }

  // Получаем имя файла из заголовка
  const contentDisposition = response.headers.get("Content-Disposition");
  const fileName = contentDisposition
    ? contentDisposition.split("filename=")[1].replace(/"/g, "")
    : `arts_export_with_stocks_${new Date().toISOString().split("T")[0]}.xlsx`;

  // Создаем blob и скачиваем файл
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

// Использование
await exportArtsToExcelWithStocks();
```

#### Axios

```typescript
import axios from "axios";

const exportArtsToExcelWithStocks = async () => {
  const token = localStorage.getItem("authToken");

  const response = await axios.get("/api/arts/export-with-stocks", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    responseType: "blob", // Важно указать blob для бинарных данных
  });

  // Получаем имя файла из заголовка
  const contentDisposition = response.headers["content-disposition"];
  const fileName = contentDisposition
    ? contentDisposition.split("filename=")[1].replace(/"/g, "")
    : `arts_export_with_stocks_${new Date().toISOString().split("T")[0]}.xlsx`;

  // Создаем blob и скачиваем файл
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

// Использование
await exportArtsToExcelWithStocks();
```

#### React компонент с кнопкой

```typescript
import React, { useState } from "react";
import axios from "axios";

const ExportArtsButton: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");

      const response = await axios.get("/api/arts/export", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      });

      const contentDisposition = response.headers["content-disposition"];
      const fileName = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : `arts_export_${new Date().toISOString().split("T")[0]}.xlsx`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Ошибка при экспорте:", error);
      alert("Не удалось экспортировать артикулы");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleExport} disabled={loading}>
      {loading ? "Экспорт..." : "Экспортировать в Excel"}
    </button>
  );
};

export default ExportArtsButton;
```

#### React компонент с двумя кнопками экспорта

```typescript
import React, { useState } from "react";
import axios from "axios";

const ExportArtsButtons: React.FC = () => {
  const [loadingBasic, setLoadingBasic] = useState(false);
  const [loadingExtended, setLoadingExtended] = useState(false);

  const handleBasicExport = async () => {
    setLoadingBasic(true);
    try {
      const token = localStorage.getItem("authToken");

      const response = await axios.get("/api/arts/export", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      });

      const contentDisposition = response.headers["content-disposition"];
      const fileName = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : `arts_export_${new Date().toISOString().split("T")[0]}.xlsx`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Ошибка при экспорте:", error);
      alert("Не удалось экспортировать артикулы");
    } finally {
      setLoadingBasic(false);
    }
  };

  const handleExtendedExport = async () => {
    setLoadingExtended(true);
    try {
      const token = localStorage.getItem("authToken");

      const response = await axios.get("/api/arts/export-with-stocks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      });

      const contentDisposition = response.headers["content-disposition"];
      const fileName = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : `arts_export_with_stocks_${
            new Date().toISOString().split("T")[0]
          }.xlsx`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Ошибка при экспорте:", error);
      alert("Не удалось экспортировать артикулы с запасами");
    } finally {
      setLoadingExtended(false);
    }
  };

  return (
    <div>
      <button onClick={handleBasicExport} disabled={loadingBasic}>
        {loadingBasic ? "Экспорт..." : "Экспортировать в Excel"}
      </button>
      <button onClick={handleExtendedExport} disabled={loadingExtended}>
        {loadingExtended ? "Экспорт..." : "Экспортировать с запасами"}
      </button>
    </div>
  );
};

export default ExportArtsButtons;
```

---

## Примечания

- Обновление btradeStock для всех артикулов выполняется асинхронно в фоне. Клиент получает ответ сразу после запуска процесса (статус 202 Accepted), не дожидаясь завершения. Процесс может занять значительное время в зависимости от количества артикулов (задержка 100ms между запросами)
- Прогресс выполнения массового обновления можно отслеживать в логах сервера
- Если товар не найден на sharik.ua, артикул пропускается при массовом обновлении
- Excel файл содержит все поля модели Art, включая пустые значения
- Формат дат в Excel: `DD.MM.YYYY` (русский формат)
- Имя файла Excel формируется автоматически:
  - Базовый экспорт: `arts_export_YYYY-MM-DD.xlsx`
  - Расширенный экспорт: `arts_export_with_stocks_YYYY-MM-DD.xlsx`
- **Расширенный экспорт (`/export-with-stocks`)**:
  - Использует MongoDB агрегацию для эффективного расчета запасов (один запрос вместо N+1)
  - Значение "Запасы" рассчитывается как сумма всех `quant` из коллекции `Pos` для каждого артикула
  - Значение "Витрина" рассчитывается как `btradeStock.value - Запасы`
  - Если у артикула нет позиций, "Запасы" = `0`
  - Если у артикула нет `btradeStock.value`, используется `0` для расчета "Витрина"
