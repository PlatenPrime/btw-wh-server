import { IRow, Row } from "../../../models/Row.js";

export const getAllRowsUtil = async (): Promise<IRow[]> => {
  const rows = await Row.find().sort({ title: 1 });
  return rows;
};

