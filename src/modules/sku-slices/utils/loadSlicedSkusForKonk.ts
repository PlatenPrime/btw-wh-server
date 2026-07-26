import { Sku } from "../../skus/models/Sku.js";
import { Skugr } from "../../skugrs/models/Skugr.js";

export type SlicedSkuLean = {
  _id: { toString(): string };
  productId?: string;
  title?: string;
  url?: string;
};

type SkugrLean = {
  skus?: Array<{ toString(): string }>;
};

/**
 * SKU конкурента, входящие хотя бы в одну группу с isSliced: true.
 */
export async function loadSlicedSkusForKonk(
  konkName: string,
  select: string = "_id productId"
): Promise<SlicedSkuLean[]> {
  const skugrs = (await Skugr.find({ konkName, isSliced: true })
    .select("skus")
    .lean()) as SkugrLean[];
  const slicedSkuIds = Array.from(
    new Set(
      skugrs.flatMap((group) =>
        (group.skus ?? []).map((skuId) => skuId.toString())
      )
    )
  );
  if (slicedSkuIds.length === 0) return [];

  return (await Sku.find({ konkName, _id: { $in: slicedSkuIds } })
    .select(select)
    .lean()) as SlicedSkuLean[];
}
