type SliceType = "analogSlices" | "skuSlices";

type ExcludedCompetitorsConfig = Record<SliceType, readonly string[]>;

/**
 * Временные исключения конкурентов из задач формирования срезов.
 * Для исключения конкурента достаточно добавить его имя в нужный список.
 */
export const excludedCompetitors: ExcludedCompetitorsConfig = {
  analogSlices: [],
  skuSlices: ["yumi"],
};

export function normalizeCompetitorName(value: string): string {
  return value.trim().toLowerCase();
}

export function getExcludedCompetitorSet(sliceType: SliceType): Set<string> {
  return new Set(
    excludedCompetitors[sliceType].map((name) => normalizeCompetitorName(name))
  );
}

/**
 * Доп. исключения только для компенсации (основной cron срезов не смотрит сюда).
 * Air: Cloudflare 520 — повторный серверный опрос бессмысленен; хвост через client-ingest.
 */
export const compensationExcludedCompetitors: ExcludedCompetitorsConfig = {
  analogSlices: ["air"],
  skuSlices: ["air"],
};

/** Union cron-исключений и compensation-only списка. */
export function getCompensationExcludedCompetitorSet(
  sliceType: SliceType
): Set<string> {
  const names = [
    ...excludedCompetitors[sliceType],
    ...compensationExcludedCompetitors[sliceType],
  ];
  return new Set(names.map((name) => normalizeCompetitorName(name)));
}
