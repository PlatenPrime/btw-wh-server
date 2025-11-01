import { IPos } from "../../../models/Pos.js";

type GroupedPoses = {
  pogrebi: IPos[];
  merezhi: IPos[];
  other: IPos[];
};

/**
 * Группирует позиции по складам (pogrebi, merezhi, other)
 */
export const groupPosesByWarehouseUtil = (
  poses: IPos[]
): GroupedPoses => {
  const pogrebi: IPos[] = [];
  const merezhi: IPos[] = [];
  const other: IPos[] = [];

  poses.forEach((pos) => {
    const sklad = pos.sklad?.toLowerCase();
    if (sklad === "pogrebi") {
      pogrebi.push(pos);
    } else if (sklad === "merezhi") {
      merezhi.push(pos);
    } else {
      other.push(pos);
    }
  });

  return { pogrebi, merezhi, other };
};

