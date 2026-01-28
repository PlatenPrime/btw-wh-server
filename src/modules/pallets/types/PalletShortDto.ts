import type { IPallet } from "../models/Pallet.js";

/**
 * Short, read-only representation of a pallet for list and grouping views.
 *
 * Used by:
 * - pallets module list endpoints
 * - rows module when returning pallets for a row
 * - pallet-groups module when returning pallets inside a group
 */
export type PalletShortDto = {
  /**
   * Pallet identifier as string.
   */
  id: string;

  /**
   * Pallet human-readable title.
   */
  title: string;

  /**
   * Whether pallet is default/system one.
   */
  isDef: boolean;

  /**
   * Sector index used in warehouse layout logic.
   */
  sector: IPallet["sector"];

  /**
   * True when pallet has no poses attached.
   */
  isEmpty: boolean;
};
