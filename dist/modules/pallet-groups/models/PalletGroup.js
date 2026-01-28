import { model, Schema } from "mongoose";
const palletGroupSchema = new Schema({
    title: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    order: {
        type: Number,
        required: true,
        min: [1, "Order must be a positive integer"],
    },
    pallets: [
        {
            type: Schema.Types.ObjectId,
            ref: "Pallet",
            required: true,
        },
    ],
}, {
    timestamps: true,
});
/**
 * PalletGroup Mongoose model.
 * @see IPalletGroup
 */
export const PalletGroup = model("PalletGroup", palletGroupSchema);
