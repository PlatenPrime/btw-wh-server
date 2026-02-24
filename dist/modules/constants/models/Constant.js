import mongoose, { Schema } from "mongoose";
const constantSchema = new Schema({
    name: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    data: {
        type: Schema.Types.Mixed,
        default: () => ({}),
        validate: {
            validator(value) {
                if (value === null || value === undefined)
                    return true;
                if (typeof value !== "object" || Array.isArray(value))
                    return false;
                return Object.values(value).every((v) => typeof v === "string");
            },
            message: "data must be an object with string values",
        },
    },
}, { timestamps: true });
/**
 * Constant Mongoose model
 * @see IConstant
 */
export const Constant = mongoose.model("Constant", constantSchema, "constants");
