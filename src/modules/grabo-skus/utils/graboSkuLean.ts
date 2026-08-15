import type { Types } from "mongoose";

export type GraboSkuLean = {
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
};
