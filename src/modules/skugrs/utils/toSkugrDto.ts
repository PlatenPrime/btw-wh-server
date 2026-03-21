import type { Types } from "mongoose";

type SkugrDocLike = {
  _id: Types.ObjectId | { toString: () => string };
  konkName: string;
  prodName: string;
  title: string;
  url: string;
  skus: (Types.ObjectId | { toString: () => string })[];
  createdAt?: Date;
  updatedAt?: Date;
};

export const toSkugrDto = (doc: SkugrDocLike) => ({
  _id: doc._id.toString(),
  konkName: doc.konkName,
  prodName: doc.prodName,
  title: doc.title,
  url: doc.url,
  skus: doc.skus.map((id) => id.toString()),
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});
