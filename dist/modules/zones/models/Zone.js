import mongoose, { Schema } from "mongoose";
// Схема для Zone
const zoneSchema = new Schema({
    title: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function (v) {
                // Pattern: 1-3 numeric segments separated by dashes
                // Each segment: 1-2 digits (1-99)
                return /^\d{1,2}(-\d{1,2}){0,2}$/.test(v);
            },
            message: 'Title must be in format: 1-3 numeric segments (e.g., "42-1", "22-5-1", "42-13-2")',
        },
    },
    bar: {
        type: Number,
        required: true,
        unique: true,
        min: [1, "Bar must be a positive number"],
    },
    sector: {
        type: Number,
        required: true,
        default: 0,
        min: [0, "Sector must be non-negative"],
    },
}, { timestamps: true });
// Индексы для оптимизации поиска (уникальные поля уже имеют индексы)
/**
 * Zone Mongoose model
 * @see IZone
 */
export const Zone = mongoose.model("Zone", zoneSchema);
