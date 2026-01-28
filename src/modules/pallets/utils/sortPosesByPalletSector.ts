import { IPos } from "../../poses/models/Pos.js";

type PosWithPalletData = Pick<IPos, "palletData">;

/**
 * Sorts poses by palletData.sector using numeric comparison
 * Similar to sortPosesByPalletTitle but sorts by sector instead of title
 * Positions with missing/null/undefined sector are treated as 0
 * @param poses - Array of poses to sort (mutates the array)
 * @returns Sorted array of poses
 */
export function sortPosesByPalletSector(poses: PosWithPalletData[]) {
  return poses.sort((a, b) => {
    const sectorA = typeof a.palletData.sector === "number" ? a.palletData.sector : 0;
    const sectorB = typeof b.palletData.sector === "number" ? b.palletData.sector : 0;

    if (sectorA < sectorB) {
      return -1;
    }
    if (sectorA > sectorB) {
      return 1;
    }
    return 0;
  });
}

