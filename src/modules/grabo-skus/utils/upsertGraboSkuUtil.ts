import type { GraboSkuData } from "../../browser/grabo/utils/types/graboSkuData.js";
import { GraboSku } from "../models/GraboSku.js";

export type GraboSkuUpsertFields = GraboSkuData & { url: string };

export async function upsertGraboSkuUtil(
  fields: GraboSkuUpsertFields,
  now: Date = new Date()
): Promise<"created" | "updated"> {
  const existing = await GraboSku.exists({ productId: fields.productId });

  await GraboSku.findOneAndUpdate(
    { productId: fields.productId },
    {
      $set: {
        productId: fields.productId,
        title: fields.title,
        isNewProduct: fields.isNew,
        color: fields.color,
        size: fields.size,
        material: fields.material,
        gas: fields.gas,
        language: fields.language,
        gasCapacity: fields.gasCapacity,
        tags: fields.tag,
        images: fields.images,
        url: fields.url,
        isOnSite: true,
        lastSeenAt: now,
      },
    },
    { upsert: true }
  );

  return existing ? "updated" : "created";
}
