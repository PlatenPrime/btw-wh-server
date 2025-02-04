import mongoose from "mongoose";
const btradeStockSchema = new mongoose.Schema({
    value: Number,
    date: { type: Date, default: Date.now },
}, { _id: false });
const ArtSchema = new mongoose.Schema({
    artikul: {
        type: String,
        required: true,
        unique: true,
    },
    nameukr: String,
    namerus: String,
    zone: {
        type: String,
        required: true,
    },
    limit: Number,
    marker: String,
    btradeStock: btradeStockSchema,
}, { timestamps: true });
export default mongoose.model("Art", ArtSchema);
