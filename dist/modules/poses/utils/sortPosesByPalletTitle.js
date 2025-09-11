/**
 * Sorts poses by palletData.title using numeric comparison
 * Similar to sortPalletsByTitle but works with poses that have palletData
 * @param poses - Array of poses to sort
 * @returns Sorted array of poses
 */
export function sortPosesByPalletTitle(poses) {
    return poses.sort((a, b) => {
        const partsA = a.palletData.title.split("-");
        const partsB = b.palletData.title.split("-");
        for (let i = 0; i < partsA.length; i++) {
            const numA = parseInt(partsA[i]);
            const numB = parseInt(partsB[i]);
            if (numA < numB) {
                return -1;
            }
            if (numA > numB) {
                return 1;
            }
        }
        return 0;
    });
}
