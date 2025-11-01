import { IRow, Row } from "../../../models/Row.js";

type UpdateRowInput = {
  id: string;
  title: string;
};

export const updateRowUtil = async ({
  id,
  title,
}: UpdateRowInput): Promise<IRow | null> => {
  const updatedRow = await Row.findByIdAndUpdate(
    id,
    { title },
    { new: true, runValidators: true }
  );

  return updatedRow as IRow | null;
};

