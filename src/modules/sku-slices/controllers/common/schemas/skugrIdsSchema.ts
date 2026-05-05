import { z } from "zod";

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

const objectIdString = z
  .string()
  .trim()
  .regex(OBJECT_ID_REGEX, "skugrIds must contain valid 24-hex ObjectId values");

/**
 * Опциональный список skugrIds в query: поддерживается как массив (`skugrIds[]=a&skugrIds[]=b`),
 * так и CSV (`skugrIds=a,b`). Пустые элементы и пробелы по краям игнорируются.
 * После парсинга — массив уникальных hex-ObjectId длиной 24 в исходном порядке.
 */
export const skugrIdsSchema = z
  .preprocess((raw) => {
    if (raw === undefined || raw === null || raw === "") return undefined;
    const parts: string[] = Array.isArray(raw)
      ? raw.flatMap((v) => (typeof v === "string" ? v.split(",") : []))
      : typeof raw === "string"
        ? raw.split(",")
        : [];
    const trimmed = parts.map((s) => s.trim()).filter((s) => s.length > 0);
    if (trimmed.length === 0) return undefined;
    return Array.from(new Set(trimmed));
  }, z.array(objectIdString).min(1).optional());

export type SkugrIdsInput = z.infer<typeof skugrIdsSchema>;
