import { getPositionSectorUtil } from "./getPositionSector.js";
import { IPos } from "../../models/Pos.js";

export const sortPositionsByPalletSectorUtil = (positions: IPos[]): IPos[] => {
    return [...positions].sort((a, b) => {
    const sectorA = getPositionSectorUtil(a);
    const sectorB = getPositionSectorUtil(b);

    return sectorA - sectorB;
  });
};