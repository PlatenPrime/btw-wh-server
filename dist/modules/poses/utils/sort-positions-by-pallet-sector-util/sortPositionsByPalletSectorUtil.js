import { getPositionSectorUtil } from "./getPositionSector.js";
export const sortPositionsByPalletSectorUtil = (positions) => {
    return [...positions].sort((a, b) => {
        const sectorA = getPositionSectorUtil(a);
        const sectorB = getPositionSectorUtil(b);
        return sectorA - sectorB;
    });
};
