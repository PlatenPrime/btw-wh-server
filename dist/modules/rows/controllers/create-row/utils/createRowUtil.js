import { Row } from "../../../models/Row.js";
export const createRowUtil = async ({ title, }) => {
    const row = new Row({ title });
    await row.save();
    return row;
};
