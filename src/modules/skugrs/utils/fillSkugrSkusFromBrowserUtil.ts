import mongoose, { type AnyBulkWriteOperation } from "mongoose";
import { Sku } from "../../skus/models/Sku.js";
import { toCanonicalSkuProductId } from "../../skus/utils/toCanonicalSkuProductId.js";
import { fetchGroupProductsByKonkName } from "../../browser/group-products/fetchGroupProductsByKonkName.js";
import type { GroupBrowserProduct } from "../../browser/group-products/types.js";
import type { ISkugr } from "../models/Skugr.js";
import { Skugr } from "../models/Skugr.js";

const BULK_WRITE_CHUNK_SIZE = 500;

export type FillSkugrSkusFromBrowserStats = {
  fetched: number;
  dedupedByUrl: number;
  skippedAlreadyInGroup: number;
  skippedNoProductId: number;
  skippedProductIdConflict: number;
  linkedExisting: number;
  created: number;
};

export type FillSkugrSkusFromBrowserResult = {
  skugr: ISkugr;
  stats: FillSkugrSkusFromBrowserStats;
};

export async function fillSkugrSkusFromBrowserUtil(
  skugrId: string,
  options?: { maxPages?: number },
): Promise<FillSkugrSkusFromBrowserResult | null> {
  const skugr = await Skugr.findById(skugrId).exec();
  if (!skugr) {
    return null;
  }

  const products = await fetchGroupProductsByKonkName(skugr.konkName, {
    groupUrl: skugr.url,
    ...(options?.maxPages !== undefined && { maxPages: options.maxPages }),
  });

  let skippedNoProductId = 0;
  const byUrl = new Map<string, GroupBrowserProduct>();
  for (const p of products) {
    const rawPid = p.productId?.trim() ?? "";
    if (!rawPid) {
      skippedNoProductId += 1;
      continue;
    }
    byUrl.set(p.url, p);
  }
  const deduped = [...byUrl.values()];
  const dedupedByUrl = products.length - skippedNoProductId - deduped.length;

  let skippedAlreadyInGroup = 0;

  if (deduped.length === 0) {
    return {
      skugr,
      stats: {
        fetched: products.length,
        dedupedByUrl,
        skippedAlreadyInGroup: 0,
        skippedNoProductId,
        skippedProductIdConflict: 0,
        linkedExisting: 0,
        created: 0,
      },
    };
  }

  const urls = deduped.map((row) => row.url);

  const existingSkus = await Sku.find({ url: { $in: urls } })
    .select("_id url productId")
    .lean()
    .exec();

  const urlToSkuId = new Map<string, mongoose.Types.ObjectId>();
  for (const s of existingSkus) {
    urlToSkuId.set(s.url, s._id as mongoose.Types.ObjectId);
  }

  const groupSkuIdSet = new Set(skugr.skus.map((id) => id.toString()));

  const linkIds: mongoose.Types.ObjectId[] = [];
  const toInsert: Array<{
    konkName: string;
    prodName: string;
    productId: string;
    title: string;
    url: string;
    imageUrl: string;
  }> = [];

  for (const row of deduped) {
    const rawPid = row.productId.trim();
    const canonicalPid = toCanonicalSkuProductId(skugr.konkName, rawPid);
    const existingId = urlToSkuId.get(row.url);
    if (existingId) {
      if (groupSkuIdSet.has(existingId.toString())) {
        skippedAlreadyInGroup += 1;
      } else {
        linkIds.push(existingId);
      }
    } else {
      toInsert.push({
        konkName: skugr.konkName,
        prodName: skugr.prodName,
        productId: canonicalPid,
        title: row.title,
        url: row.url,
        imageUrl: row.imageUrl,
      });
    }
  }

  let skippedProductIdConflict = 0;
  const uniqueToInsert: typeof toInsert = [];
  const seenBatchPid = new Set<string>();
  for (const doc of toInsert) {
    if (seenBatchPid.has(doc.productId)) {
      skippedProductIdConflict += 1;
      continue;
    }
    seenBatchPid.add(doc.productId);
    uniqueToInsert.push(doc);
  }

  const insertProductIds = [...new Set(uniqueToInsert.map((d) => d.productId))];
  const takenByProductId = await Sku.find({
    productId: { $in: insertProductIds },
  })
    .select("productId url")
    .lean()
    .exec();
  const takenPidSet = new Set(takenByProductId.map((d) => d.productId));

  const toInsertFiltered = uniqueToInsert.filter((doc) => {
    if (!takenPidSet.has(doc.productId)) return true;
    const owner = takenByProductId.find((t) => t.productId === doc.productId);
    if (owner?.url === doc.url) return true;
    skippedProductIdConflict += 1;
    return false;
  });

  const insertedIds: mongoose.Types.ObjectId[] = [];

  for (let i = 0; i < toInsertFiltered.length; i += BULK_WRITE_CHUNK_SIZE) {
    const chunk = toInsertFiltered.slice(i, i + BULK_WRITE_CHUNK_SIZE);
    const operations: AnyBulkWriteOperation[] = chunk.map((doc) => ({
      insertOne: { document: doc },
    }));
    const result = await Sku.bulkWrite(operations, { ordered: false });
    const chunkIds = Object.values(result.insertedIds) as mongoose.Types.ObjectId[];
    insertedIds.push(...chunkIds);
  }

  const combined = [...linkIds, ...insertedIds];
  if (combined.length > 0) {
    await Skugr.updateOne(
      { _id: skugr._id },
      { $addToSet: { skus: { $each: combined } } },
    ).exec();
  }

  const updated = await Skugr.findById(skugrId).exec();
  if (!updated) {
    return null;
  }

  return {
    skugr: updated,
    stats: {
      fetched: products.length,
      dedupedByUrl,
      skippedAlreadyInGroup,
      skippedNoProductId,
      skippedProductIdConflict,
      linkedExisting: linkIds.length,
      created: insertedIds.length,
    },
  };
}
