import type { HydratedDocument } from "mongoose";
import type { ISku } from "../../skus/models/Sku.js";
import type { ISkugr } from "../models/Skugr.js";

export const toSkugrWithSkusDto = (
  skugr: ISkugr,
  orderedSkus: HydratedDocument<ISku>[],
) => ({
  _id: skugr._id.toString(),
  konkName: skugr.konkName,
  prodName: skugr.prodName,
  title: skugr.title,
  url: skugr.url,
  skus: orderedSkus,
  createdAt: skugr.createdAt,
  updatedAt: skugr.updatedAt,
});
