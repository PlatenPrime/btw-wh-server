type SliceType = "analogSlices" | "skuSlices";

type ExcludedCompetitorsConfig = Record<SliceType, readonly string[]>;

/**
 * Временные исключения конкурентов из задач формирования срезов.
 * Для исключения конкурента достаточно добавить его имя в нужный список.
 */
export const excludedCompetitors: ExcludedCompetitorsConfig = {
  analogSlices: ["air"],
  skuSlices: ["air"],
};

export function normalizeCompetitorName(value: string): string {
  return value.trim().toLowerCase();
}

export function getExcludedCompetitorSet(sliceType: SliceType): Set<string> {
  return new Set(
    excludedCompetitors[sliceType].map((name) => normalizeCompetitorName(name))
  );
}
