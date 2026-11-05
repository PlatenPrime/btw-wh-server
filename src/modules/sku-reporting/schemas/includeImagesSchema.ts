import { z } from "zod";

/**
 * Opt-in колонка «Фото». Без поля / undefined / false — без картинок.
 * Default false на рівні контракту (не Zod .default — щоб input-тип лишався optional).
 */
export const includeImagesSchema = z.boolean().optional();
