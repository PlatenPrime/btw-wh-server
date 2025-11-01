import { Row } from "../../../models/Row.js";
export const getAllRowsUtil = async () => {
    const rows = await Row.find().sort({ title: 1 });
    return rows;
};
