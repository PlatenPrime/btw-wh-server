import { IRow, Row } from "../../../models/Row.js";

type CreateRowInput = {
  title: string;
};

export const createRowUtil = async ({
  title,
}: CreateRowInput): Promise<IRow> => {
  const row: IRow = new Row({ title });
  await row.save();
  return row as IRow;
};
