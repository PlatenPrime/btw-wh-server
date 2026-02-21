import mongoose, { Schema } from "mongoose";
const delArtikulsSchema = new Schema({}, {
    _id: false,
    strict: false,
});
const delProdSchema = new Schema({
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
}, { _id: false });
const delSchema = new Schema({
    title: { type: String, required: true },
    prodName: { type: String, required: true },
    prod: {
        type: delProdSchema,
        required: false,
    },
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
