import { IPos } from "../../poses/models/Pos.js";

/**
 * Gets sector number from position, converting null/undefined to 0
 *
 * @param position - Position to get sector from
 * @returns Sector number (0 if sector is null/undefined)
 */
export const getPositionSector = (position: IPos): number => {
    return position.palletData.sector
      ? parseInt(position.palletData.sector, 10)
      : 0;
  };
  