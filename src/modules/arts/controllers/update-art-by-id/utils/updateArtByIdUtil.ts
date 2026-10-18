import { IArt, Art } from "../../../models/Art.js";

type UpdateArtByIdUtilInput = {
  id: string;
  limit?: number;
  prodName?: string;
  bar?: string;
  boxbar?: string;
};

export const updateArtByIdUtil = async ({
  id,
  limit,
  prodName,
  bar,
  boxbar,
}: UpdateArtByIdUtilInput): Promise<IArt | null> => {
  const $set: Record<string, unknown> = {};
  if (limit !== undefined) {
    $set.limit = limit;
  }
  if (prodName !== undefined) {
    $set.prodName = prodName;
  }
  if (bar !== undefined) {
    $set.bar = bar;
  }
  if (boxbar !== undefined) {
    $set.boxbar = boxbar;
  }

  const updatedArt: IArt | null = await Art.findByIdAndUpdate(
    id,
    { $set },
    {
      returnDocument: "after",
      runValidators: true,
      select:
        "artikul prodName zone namerus nameukr limit marker bar boxbar btradeStock createdAt updatedAt",
    },
  );

  return updatedArt;
};
