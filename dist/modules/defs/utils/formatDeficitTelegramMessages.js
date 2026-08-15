import { DEFICIT_REPORT_CHUNK_SIZE } from "../constants/deficitReportCron.js";
function chunkArray(items, chunkSize) {
    const chunks = [];
    for (let i = 0; i < items.length; i += chunkSize) {
        chunks.push(items.slice(i, i + chunkSize));
    }
    return chunks;
}
function separateDeficitsByStatus(result) {
    const critical = [];
    const limited = [];
    for (const [artikul, data] of Object.entries(result)) {
        if (data.status === "critical") {
            critical.push([artikul, data]);
        }
        else if (data.status === "limited") {
            limited.push([artikul, data]);
        }
    }
    return { critical, limited };
}
function createDeficitChunkMessage(deficits, startIndex, totalDeficits, category) {
    const endIndex = startIndex + deficits.length - 1;
    const rangeText = `${startIndex + 1}-${endIndex + 1} з ${totalDeficits}`;
    const categoryIcon = category === "critical" ? "🔴" : "🟡";
    const categoryName = category === "critical" ? "Критичні дефіцити" : "Дефіцити в ліміті";
    const deficitList = deficits
        .map(([artikul, data]) => `${artikul}: ${data.difQuant || 0}`)
        .join("\n");
    return `${categoryIcon} ${categoryName} (${rangeText}):\n${deficitList}`;
}
function appendCategoryChunks(messages, entries, category) {
    if (entries.length === 0) {
        return;
    }
    const chunks = chunkArray(entries, DEFICIT_REPORT_CHUNK_SIZE);
    chunks.forEach((chunk, index) => {
        messages.push(createDeficitChunkMessage(chunk, index * DEFICIT_REPORT_CHUNK_SIZE, entries.length, category));
    });
}
/**
 * Сообщения для чата дефицитов: limited-чанки, critical-чанки, summary.
 * Пустой снимок — одно empty-state сообщение.
 */
export function formatDeficitTelegramMessages(result) {
    const totalDeficits = Object.keys(result).length;
    if (totalDeficits === 0) {
        return ["🎉 Відмінно!\nДефіцитів не знайдено\nВсі артикули в нормі"];
    }
    const { critical, limited } = separateDeficitsByStatus(result);
    const messages = [];
    appendCategoryChunks(messages, limited, "limited");
    appendCategoryChunks(messages, critical, "critical");
    messages.push(`✅ Розрахунок дефіцитів завершено\n` +
        `• Всього дефіцитів: ${totalDeficits}\n` +
        `• Критичних: ${critical.length}\n` +
        `• В ліміті: ${limited.length}`);
    return messages;
}
export function formatDeficitTelegramErrorMessage(error) {
    const msg = error instanceof Error ? error.message : "Невідома помилка";
    return `❌ Помилка при розрахунку дефіцитів\n\nПомилка: ${msg}`;
}
