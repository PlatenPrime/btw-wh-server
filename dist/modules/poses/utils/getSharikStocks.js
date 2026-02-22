import { getSharikStockData } from "../../browser/sharik/utils/getSharikStockData.js";
/**
 * Расширяет объекты массива stocks данными с сайта sharik.ua
 * @param stocks - Объект с объединенными позициями по артикулам
 * @param limits - Объект с лимитами по артикулам из модели Art
 * @returns Promise с расширенными данными, включающими sharikQuant, difQuant и limit
 */
export async function getSharikStocks(stocks, limits = {}) {
    const startTime = performance.now();
    try {
        const extendedStocks = {};
        const artikuls = Object.keys(stocks);
        console.log(`Начинаем получение данных Sharik для ${artikuls.length} артикулов`);
        // Обрабатываем каждый артикул последовательно с задержкой
        for (let i = 0; i < artikuls.length; i++) {
            const artikul = artikuls[i];
            try {
                const stockData = stocks[artikul];
                const sharikData = await getSharikStockData(artikul);
                // Если данные с Sharik получены, используем их
                if (sharikData) {
                    const sharikQuant = sharikData.quantity;
                    const difQuant = sharikQuant - stockData.quant;
                    extendedStocks[artikul] = {
                        ...stockData,
                        sharikQuant,
                        difQuant,
                        limit: limits[artikul],
                    };
                }
                else {
                    // Если данные не получены, устанавливаем нулевые значения
                    extendedStocks[artikul] = {
                        ...stockData,
                        sharikQuant: 0,
                        difQuant: -stockData.quant, // Разница будет отрицательной
                        limit: limits[artikul],
                    };
                }
            }
            catch (error) {
                console.warn(`Ошибка при получении данных Sharik для артикула ${artikul}:`, error);
                // В случае ошибки устанавливаем нулевые значения
                extendedStocks[artikul] = {
                    ...stocks[artikul],
                    sharikQuant: 0,
                    difQuant: -stocks[artikul].quant,
                    limit: limits[artikul],
                };
            }
            // Добавляем задержку между запросами (кроме последнего)
            if (i < artikuls.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms задержка
            }
            // Логируем прогресс каждые 10 артикулов
            if ((i + 1) % 10 === 0 || i === artikuls.length - 1) {
                console.log(`Обработано ${i + 1} из ${artikuls.length} артикулов`);
            }
        }
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        console.log(`getSharikStocks выполнена за ${executionTime.toFixed(2)}ms. ` +
            `Обработано ${artikuls.length} артикулов.`);
        return extendedStocks;
    }
    catch (error) {
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        console.error(`Ошибка при получении данных Sharik (выполнение заняло ${executionTime.toFixed(2)}ms):`, error);
        throw new Error("Не удалось получить данные Sharik");
    }
}
