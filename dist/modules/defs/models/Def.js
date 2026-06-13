import { Schema } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";
// Схема для результата расчета дефицитов
const deficitCalculationResultSchema = new Schema({}, {
    _id: false,
    strict: false, // Позволяет сохранять динамические ключи
});
// Основная схема для расчета дефицитов
const defSchema = new Schema({
    result: {
        type: deficitCalculationResultSchema,
        required: true,
    },
    total: {
        type: Number,
        required: true,
        default: 0,
    },
    totalCriticalDefs: {
        type: Number,
        required: true,
        default: 0,
    },
    totalLimitDefs: {
        type: Number,
        required: true,
        default: 0,
    },
}, { timestamps: true });
/**
 * Def Mongoose model
 * @see IDef
 */
export const Def = getOrCreateModel("Def", defSchema, "defs");
