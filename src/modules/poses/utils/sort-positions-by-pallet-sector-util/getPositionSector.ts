import { IPos } from "../../models/Pos.js";

/**
 * Gets sector number from position, converting null/undefined to 0.
 *
 * Pallet sector is now stored as a number in the database, so we avoid
 * any string parsing here and rely purely on numeric comparison.
 *
 * @param position - Position to get sector from
 * @returns Sector number (0 if sector is null/undefined)
 */
export const getPositionSectorUtil = (position: IPos): number => {
  const { sector } = position.palletData;

  if (typeof sector !== "number" || Number.isNaN(sector)) {
    return 0;
  }

  return sector;
};
