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
