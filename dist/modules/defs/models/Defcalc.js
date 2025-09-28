import mongoose, { Schema } from "mongoose";
// Схема для элемента дефицита
const deficitItemSchema = new Schema({
    nameukr: { type: String, required: true },
    quant: { type: Number, required: true }, // общее количество посчитанного товара на складе
    sharikQuant: { type: Number, required: true }, // количество товара на сайте
    difQuant: { type: Number, required: true }, // разница между sharikQuant и quant
    defLimit: { type: Number, required: true }, // сумма quant + artLimit
}, { _id: false });
// Схема для результата расчета дефицитов
const deficitCalculationResultSchema = new Schema({}, {
    _id: false,
    strict: false, // Позволяет сохранять динамические ключи
});
// Основная схема для расчета дефицитов
const defcalcSchema = new Schema({
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
 * Defcalc Mongoose model
 * @see IDefcalc
 */
export const Defcalc = mongoose.model("Defcalc", defcalcSchema);
