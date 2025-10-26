/**
 * Sorts positions by sector in ascending order
 * Positions with null/undefined sector are treated as having sector = 0
 *
 * @param positions - Array of positions to sort
 * @returns Sorted array of positions by sector (ASC)
 */
export const sortPositionsBySector = (positions) => {
    return [...positions].sort((a, b) => {
        const sectorA = a.palletData.sector ? parseInt(a.palletData.sector, 10) : 0;
        const sectorB = b.palletData.sector ? parseInt(b.palletData.sector, 10) : 0;
        return sectorA - sectorB;
    });
};
/**
 * Gets sector number from position, converting null/undefined to 0
 *
 * @param position - Position to get sector from
 * @returns Sector number (0 if sector is null/undefined)
 */
export const getPositionSector = (position) => {
    return position.palletData.sector
        ? parseInt(position.palletData.sector, 10)
        : 0;
};
