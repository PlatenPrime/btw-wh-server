import { Document, model, Schema, Types } from "mongoose";

/**
 * Pallet group document interface.
 *
 * Represents a logical group of pallets with:
 * - `title`: human-readable group name
 * - `order`: ordering index used for sector calculation
 * - `pallets`: array of pallet ids that belong to this group
 */
export interface IPalletGroup extends Document {
  _id: Types.ObjectId;
  title: string;
  order: number;
  pallets: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

const palletGroupSchema = new Schema<IPalletGroup>(
  {
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
  },
  {
    timestamps: true,
  },
);

/**
 * PalletGroup Mongoose model.
 * @see IPalletGroup
 */
export const PalletGroup = model<IPalletGroup>(
  "PalletGroup",
  palletGroupSchema,
);
