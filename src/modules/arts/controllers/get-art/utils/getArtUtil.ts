import type { Types } from "mongoose";
import type { IBtradeStock } from "../../../models/Art.js";
import { Art } from "../../../models/Art.js";
import { Prod } from "../../../../prods/models/Prod.js";

/** Вложенные данные производителя для ответа GET art по artikul */
export type ArtProdEmbed = {
  name: string;
  title: string;
  imageUrl: string;
};

type GetArtLeanBase = {
  _id: Types.ObjectId;
  artikul: string;
  zone: string;
  prodName?: string;
  nameukr?: string;
  namerus?: string;
  limit?: number;
  marker?: string;
  abc?: string;
  btradeStock?: IBtradeStock;
  createdAt?: Date;
  updatedAt?: Date;
};

export type GetArtUtilResult = GetArtLeanBase & { prod: ArtProdEmbed | null };

export const getArtUtil = async (
  artikul: string
): Promise<GetArtUtilResult | null> => {
  const art = await Art.findOne({ artikul }).lean();
  if (!art) return null;

  let prod: ArtProdEmbed | null = null;
  const prodName =
    typeof art.prodName === "string" ? art.prodName.trim() : "";
  if (prodName) {
    const doc = await Prod.findOne({ name: prodName })
      .select("name title imageUrl")
      .lean<Pick<ArtProdEmbed, "name" | "title" | "imageUrl"> | null>();
    if (doc) {
      prod = {
        name: doc.name,
        title: doc.title,
        imageUrl: doc.imageUrl,
      };
    }
  }

  return { ...art, prod } as GetArtUtilResult;
};
