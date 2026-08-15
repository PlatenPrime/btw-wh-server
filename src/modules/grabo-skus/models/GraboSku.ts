import { Document, Model, Schema, Types } from "mongoose";
import { getOrCreateModel } from "../../../utils/getOrCreateModel.js";

/**
 * Карточка товара производителя Grabo. Уникальность — productId с PDP.
 * Новинка с PDP — `isNewProduct` (не `isNew`: это reserved path Document).
 */
export interface IGraboSku extends Document {
  _id: Types.ObjectId;
  title: string;
  productId: string;
  isNewProduct: boolean;
  color: string;
  size: string;
  material: string;
  gas: string;
  language: string;
  gasCapacity: string;
  tags: string[];
  images: string[];
  url: string;
  isOnSite: boolean;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

function emptyStringField() {
  return { type: String, default: "" };
}

const graboSkuSchema = new Schema<IGraboSku>(
  {
    title: emptyStringField(),
    productId: { type: String, required: true, unique: true },
    isNewProduct: { type: Boolean, required: true, default: false },
    color: emptyStringField(),
    size: emptyStringField(),
    material: emptyStringField(),
    gas: emptyStringField(),
    language: emptyStringField(),
    gasCapacity: emptyStringField(),
    tags: { type: [String], default: () => [] },
    images: { type: [String], default: () => [] },
    url: { type: String, required: true },
    isOnSite: { type: Boolean, required: true, default: true },
    lastSeenAt: { type: Date, required: true },
  },
  { timestamps: true }
);

graboSkuSchema.index({ isOnSite: 1 });
graboSkuSchema.index({ url: 1 });
graboSkuSchema.index({ tags: 1 });

export const GraboSku: Model<IGraboSku> = getOrCreateModel<IGraboSku>(
  "GraboSku",
  graboSkuSchema,
  "graboskus"
);
