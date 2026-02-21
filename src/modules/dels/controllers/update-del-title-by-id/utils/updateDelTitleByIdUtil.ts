import { Del, IDel } from "../../../models/Del.js";
import { Prod } from "../../../../prods/models/Prod.js";

const PROD_NOT_FOUND = "PROD_NOT_FOUND" as const;

type UpdateDelTitleByIdUtilInput = {
  id: string;
  title: string;
  prodName: string;
};

export type UpdateDelTitleByIdUtilResult =
  | IDel
  | null
  | { error: typeof PROD_NOT_FOUND };

export const updateDelTitleByIdUtil = async (
  input: UpdateDelTitleByIdUtilInput
): Promise<UpdateDelTitleByIdUtilResult> => {
  const prod = await Prod.findOne({ name: input.prodName }).lean();
  if (!prod) {
    return { error: PROD_NOT_FOUND };
  }

  const del = await Del.findByIdAndUpdate(
    input.id,
    {
      title: input.title,
      prodName: input.prodName,
      prod: { title: prod.title, imageUrl: prod.imageUrl },
    },
    { new: true, runValidators: true }
  );
  return del;
};
