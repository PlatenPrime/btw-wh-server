import { logServerEgressGeo } from "../../../../../utils/server-egress-geo/logServerEgressGeo.js";
import { Row } from "../../../models/Row.js";
export const createRowUtil = async ({ title, }) => {
    const geoPromise = logServerEgressGeo("createRow");
    const row = new Row({ title });
    await row.save();
    await geoPromise;
    return row;
};
