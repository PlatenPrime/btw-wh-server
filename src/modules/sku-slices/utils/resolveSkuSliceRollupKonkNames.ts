import { Sku } from "../../skus/models/Sku.js";
import {
  getExcludedCompetitorSet,
  normalizeCompetitorName,
} from "../../slices/config/excludedCompetitors.js";

/**
 * Distinct konk names from SKU catalog, excluding skuSlices cron exclusions.
 */
export async function resolveSkuSliceRollupKonkNames(): Promise<string[]> {
  const names = await Sku.distinct("konkName");
  const excluded = getExcludedCompetitorSet("skuSlices");
  const uniqueNormalized = new Set<string>();
  const konkNames: string[] = [];

  for (const raw of names) {
    const name = typeof raw === "string" ? raw.trim() : "";
    if (name.length === 0) {
      continue;
    }
    const normalized = normalizeCompetitorName(name);
    if (excluded.has(normalized) || uniqueNormalized.has(normalized)) {
      continue;
    }
    uniqueNormalized.add(normalized);
    konkNames.push(name);
  }

  return konkNames;
}
