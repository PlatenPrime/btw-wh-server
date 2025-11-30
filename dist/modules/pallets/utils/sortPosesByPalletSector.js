/**
 * Sorts poses by palletData.sector using numeric comparison
 * Similar to sortPosesByPalletTitle but sorts by sector instead of title
 * Positions with missing/null/undefined sector are treated as 0
 * @param poses - Array of poses to sort (mutates the array)
 * @returns Sorted array of poses
 */
export function sortPosesByPalletSector(poses) {
    return poses.sort((a, b) => {
        const sectorA = a.palletData.sector
            ? parseInt(a.palletData.sector, 10)
            : 0;
        const sectorB = b.palletData.sector
            ? parseInt(b.palletData.sector, 10)
            : 0;
        if (sectorA < sectorB) {
            return -1;
        }
        if (sectorA > sectorB) {
            return 1;
        }
        return 0;
    });
}
