// models/Row.ts
import { Schema, model, Types } from 'mongoose';
const rowSchema = new Schema({
    title: { type: String, required: true },
    pallets: [{ type: Types.ObjectId, ref: 'Pallet' }],
}, { timestamps: true });
export const Row = model('Row', rowSchema);
