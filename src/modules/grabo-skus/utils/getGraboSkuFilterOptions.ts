import { GraboSku } from "../models/GraboSku.js";
import { parseGraboSizeOption } from "./parseGraboSizeOption.js";

export type GraboSkuFilterOptions = {
  color: string[];
  size: string[];
  material: string[];
  gas: string[];
  language: string[];
};

function uniqueSortedNonEmpty(values: unknown[]): string[] {
  const unique = new Set<string>();
  for (const value of values) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed !== "") unique.add(trimmed);
  }
  return [...unique].sort((a, b) => a.localeCompare(b));
}

function uniqueSortedSizeOptions(values: unknown[]): string[] {
  const unique = new Set<string>();
  for (const value of values) {
    if (typeof value !== "string") continue;
    const option = parseGraboSizeOption(value);
    if (option !== null) unique.add(option);
  }
  return [...unique].sort((a, b) => a.localeCompare(b));
}

/**
 * Уникальные значения селектов из всей коллекции, без сужения текущими фильтрами.
 */
export async function getGraboSkuFilterOptions(): Promise<GraboSkuFilterOptions> {
  const [color, size, material, gas, language] = await Promise.all([
    GraboSku.distinct("color"),
    GraboSku.distinct("size"),
    GraboSku.distinct("material"),
    GraboSku.distinct("gas"),
    GraboSku.distinct("language"),
  ]);

  return {
    color: uniqueSortedNonEmpty(color),
    size: uniqueSortedSizeOptions(size),
    material: uniqueSortedNonEmpty(material),
    gas: uniqueSortedNonEmpty(gas),
    language: uniqueSortedNonEmpty(language),
  };
}
