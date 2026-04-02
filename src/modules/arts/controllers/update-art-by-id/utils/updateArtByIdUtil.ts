import { IArt, Art } from "../../../models/Art.js";

type UpdateArtByIdUtilInput = {
  id: string;
  limit?: number;
  prodName?: string;
};

export const updateArtByIdUtil = async ({
  id,
  limit,
  prodName,
}: UpdateArtByIdUtilInput): Promise<IArt | null> => {
  const $set: Record<string, unknown> = {};
  if (limit !== undefined) {
    $set.limit = limit;
  }
  if (prodName !== undefined) {
    $set.prodName = prodName;
  }

  const updatedArt: IArt | null = await Art.findByIdAndUpdate(
    id,
    { $set },
    {
      new: true,
      runValidators: true,
      select:
        "artikul prodName zone namerus nameukr limit marker btradeStock createdAt updatedAt",
    }
  );

  return updatedArt;
};
