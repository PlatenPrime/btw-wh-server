import { logServerEgressGeo } from "../../../../../utils/server-egress-geo/logServerEgressGeo.js";
import { IRow, Row } from "../../../models/Row.js";

type CreateRowInput = {
  title: string;
};

export const createRowUtil = async ({
  title,
}: CreateRowInput): Promise<IRow> => {
  const geoPromise = logServerEgressGeo("createRow");
  const row: IRow = new Row({ title });
  await row.save();
  await geoPromise;
  return row as IRow;
};
