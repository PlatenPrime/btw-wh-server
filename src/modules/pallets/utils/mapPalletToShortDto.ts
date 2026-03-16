import type { IPallet } from "../models/Pallet.js";
import type { PalletShortDto } from "../types/PalletShortDto.js";

/**
 * Build a reusable short DTO representation for a pallet.
 */
export const mapPalletToShortDto = (
  pallet: Pick<IPallet, "_id" | "title" | "sector" | "poses" | "isDef"> & {
    palgr?: IPallet["palgr"];
  },
): PalletShortDto => {
  return {
    id: pallet._id.toString(),
    title: pallet.title,
    sector: pallet.sector,
    isDef: pallet.isDef,
    isEmpty: pallet.poses.length === 0,
    palgrId: pallet.palgr?.id?.toString() ?? undefined,
    palgrTitle: pallet.palgr?.title ?? undefined,
  };
};
