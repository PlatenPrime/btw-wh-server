/**
 * Глобальная переменная для отслеживания статуса расчета дефицитов
 */
let calculationStatus = {
    isRunning: false,
    progress: 0,
    estimatedTimeRemaining: 0,
    startedAt: null,
    lastUpdate: null,
    currentStep: undefined,
    totalItems: undefined,
    processedItems: undefined,
};
/**
 * Получить текущий статус расчета
 */
export const getCalculationStatus = () => {
    return { ...calculationStatus };
};
/**
 * Обновить статус расчета
 */
export const updateCalculationStatus = (updates) => {
    calculationStatus = {
        ...calculationStatus,
        ...updates,
        lastUpdate: new Date().toISOString(),
    };
};
/**
 * Сбросить статус расчета
 */
export const resetCalculationStatus = () => {
    calculationStatus = {
        isRunning: false,
        progress: 0,
        estimatedTimeRemaining: 0,
        startedAt: null,
        lastUpdate: new Date().toISOString(),
        currentStep: undefined,
        totalItems: undefined,
        processedItems: undefined,
    };
};
/**
 * Запустить отслеживание расчета
 */
export const startCalculationTracking = (totalItems) => {
    updateCalculationStatus({
        isRunning: true,
        progress: 0,
        estimatedTimeRemaining: 0,
        startedAt: new Date().toISOString(),
        totalItems,
        processedItems: 0,
        currentStep: "Инициализация расчета...",
    });
};
/**
 * Обновить прогресс расчета
 */
export const updateCalculationProgress = (processedItems, totalItems, currentStep) => {
    const progress = Math.round((processedItems / totalItems) * 100);
    const estimatedTimeRemaining = calculateEstimatedTimeRemaining(processedItems, totalItems);
    updateCalculationStatus({
        progress,
        processedItems,
        totalItems,
        estimatedTimeRemaining,
        currentStep,
    });
};
/**
 * Завершить отслеживание расчета
 */
export const finishCalculationTracking = () => {
    updateCalculationStatus({
        isRunning: false,
        progress: 100,
        estimatedTimeRemaining: 0,
        currentStep: "Расчет завершен",
    });
};
/**
 * Рассчитать оставшееся время в секундах
 */
const calculateEstimatedTimeRemaining = (processedItems, totalItems) => {
    if (processedItems === 0)
        return 0;
    const startTime = calculationStatus.startedAt
        ? new Date(calculationStatus.startedAt)
        : new Date();
    const currentTime = new Date();
    const elapsedSeconds = (currentTime.getTime() - startTime.getTime()) / 1000;
    const itemsPerSecond = processedItems / elapsedSeconds;
    const remainingItems = totalItems - processedItems;
    return Math.round(remainingItems / itemsPerSecond);
};
