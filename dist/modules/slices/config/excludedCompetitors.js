/**
 * Временные исключения конкурентов из задач формирования срезов.
 * Для исключения конкурента достаточно добавить его имя в нужный список.
 */
export const excludedCompetitors = {
    analogSlices: ["air"],
    skuSlices: ["air", "yumi"],
};
export function normalizeCompetitorName(value) {
    return value.trim().toLowerCase();
}
export function getExcludedCompetitorSet(sliceType) {
    return new Set(excludedCompetitors[sliceType].map((name) => normalizeCompetitorName(name)));
}
