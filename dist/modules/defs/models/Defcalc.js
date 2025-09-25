import mongoose, { Schema } from "mongoose";
// Схема для элемента дефицита
const deficitItemSchema = new Schema({
    nameukr: { type: String },
    quant: { type: Number, required: true },
    boxes: { type: Number, required: true },
    sharikQuant: { type: Number, required: true },
    difQuant: { type: Number, required: true },
    limit: { type: Number },
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
    totalDeficits: {
        type: Number,
        required: true,
        default: 0,
    },
    totalItems: {
        type: Number,
        required: true,
        default: 0,
    },
}, { timestamps: true });
// Middleware для автоматического подсчета статистики перед сохранением
defcalcSchema.pre("save", function (next) {
    const result = this.result;
    if (result && typeof result === "object") {
        // Получаем только пользовательские ключи, исключая внутренние Mongoose поля
        const userKeys = Object.keys(result).filter((key) => !key.startsWith("$") &&
            !key.startsWith("_") &&
            key !== "isNew" &&
            key !== "isModified");
        const items = userKeys
            .map((key) => result[key])
            .filter((item) => item && typeof item === "object" && "difQuant" in item);
        this.totalItems = items.length;
        this.totalDeficits = items.filter((item) => item && item.difQuant <= 0).length;
    }
    else {
        console.warn("Defcalc pre-save: result is empty or invalid");
        this.totalItems = 0;
        this.totalDeficits = 0;
    }
    next();
});
/**
 * Defcalc Mongoose model
 * @see IDefcalc
 */
export const Defcalc = mongoose.model("Defcalc", defcalcSchema);
