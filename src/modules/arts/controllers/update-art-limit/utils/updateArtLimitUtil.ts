import { IArt, Art } from "../../../models/Art.js";

type UpdateArtLimitUtilInput = {
  id: string;
  limit: number;
};

export const updateArtLimitUtil = async ({
  id,
  limit,
}: UpdateArtLimitUtilInput): Promise<IArt | null> => {
  const updatedArt: IArt | null = await Art.findByIdAndUpdate(
    id,
    { limit },
    {
      returnDocument: "after",
      runValidators: true,
      select:
        "artikul zone namerus nameukr limit marker bar boxbar btradeStock createdAt updatedAt",
    },
  );

  return updatedArt;
};
