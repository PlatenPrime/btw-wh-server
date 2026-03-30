import { Skugr } from "../../../models/Skugr.js";

type SetIsSlicedResult = {
  matchedCount: number;
  modifiedCount: number;
};

export const setIsSlicedUtil = async (): Promise<SetIsSlicedResult> => {
  const result = await Skugr.updateMany(
    { isSliced: { $exists: false } },
    { $set: { isSliced: true } },
    { runValidators: true },
  );

  return {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  };
};
