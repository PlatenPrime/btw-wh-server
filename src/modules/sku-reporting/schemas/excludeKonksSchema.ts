import { z } from "zod";

const konkNameString = z.string().trim().min(1, "excludeKonks must contain non-empty names");

/**
 * Опциональный список excludeKonks в query: массив (`excludeKonks[]=a&excludeKonks[]=b`)
 * или CSV (`excludeKonks=a,b`). Пустые элементы и пробелы по краям игнорируются.
 * После парсинга — уникальные имена в исходном порядке.
 */
export const excludeKonksSchema = z.preprocess((raw) => {
  if (raw === undefined || raw === null || raw === "") return undefined;
  const parts: string[] = Array.isArray(raw)
    ? raw.flatMap((v) => (typeof v === "string" ? v.split(",") : []))
    : typeof raw === "string"
      ? raw.split(",")
      : [];
  const trimmed = parts.map((s) => s.trim()).filter((s) => s.length > 0);
  if (trimmed.length === 0) return undefined;
  return Array.from(new Set(trimmed));
}, z.array(konkNameString).min(1).optional());

export type ExcludeKonksInput = z.infer<typeof excludeKonksSchema>;
