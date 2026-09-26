import mongoose from "mongoose";
import { NEWSKU_PROD_NAME } from "../../../../skus/constants/newskuProdName.js";
import { Sku } from "../../../../skus/models/Sku.js";
import { Skugr } from "../../../models/Skugr.js";

export type PurgePromotedFromNewskuResult = {
  groupsTotal: number;
  groupsModified: number;
  uniqueSkusRemoved: number;
  linksRemoved: number;
};

type NewskuGroupLean = {
  _id: mongoose.Types.ObjectId;
  skus: mongoose.Types.ObjectId[];
};

export async function purgePromotedFromNewskuUtil(): Promise<PurgePromotedFromNewskuResult> {
  const groups = await Skugr.find({ prodName: NEWSKU_PROD_NAME })
    .select("_id skus")
    .lean<NewskuGroupLean[]>()
    .exec();

  const groupsTotal = groups.length;
  if (groupsTotal === 0) {
    return {
      groupsTotal: 0,
      groupsModified: 0,
      uniqueSkusRemoved: 0,
      linksRemoved: 0,
    };
  }

  const allSkuIds = [
    ...new Set(groups.flatMap((g) => g.skus.map((id) => id.toString()))),
  ].map((id) => new mongoose.Types.ObjectId(id));

  if (allSkuIds.length === 0) {
    return {
      groupsTotal,
      groupsModified: 0,
      uniqueSkusRemoved: 0,
      linksRemoved: 0,
    };
  }

  const promoted = await Sku.find({
    _id: { $in: allSkuIds },
    prodName: { $ne: NEWSKU_PROD_NAME },
  })
    .select("_id")
    .lean<{ _id: mongoose.Types.ObjectId }[]>()
    .exec();

  if (promoted.length === 0) {
    return {
      groupsTotal,
      groupsModified: 0,
      uniqueSkusRemoved: 0,
      linksRemoved: 0,
    };
  }

  const promotedSet = new Set(promoted.map((s) => s._id.toString()));
  let linksRemoved = 0;
  for (const g of groups) {
    for (const id of g.skus) {
      if (promotedSet.has(id.toString())) {
        linksRemoved += 1;
      }
    }
  }

  const promotedIds = promoted.map((s) => s._id);
  const updateResult = await Skugr.updateMany(
    { prodName: NEWSKU_PROD_NAME },
    { $pull: { skus: { $in: promotedIds } } },
  ).exec();

  return {
    groupsTotal,
    groupsModified: updateResult.modifiedCount,
    uniqueSkusRemoved: promoted.length,
    linksRemoved,
  };
}
