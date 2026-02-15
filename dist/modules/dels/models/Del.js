import mongoose, { Schema } from "mongoose";
const delArtikulsSchema = new Schema({}, {
    _id: false,
    strict: false,
});
const delSchema = new Schema({
    title: { type: String, required: true },
    artikuls: {
        type: delArtikulsSchema,
        required: true,
        default: () => ({}),
    },
}, { timestamps: true });
/**
 * Del Mongoose model
 * @see IDel
 */
export const Del = mongoose.model("Del", delSchema, "dels");
