import { Row } from "../../../models/Row.js";
export const updateRowUtil = async ({ id, title, }) => {
    const updatedRow = await Row.findByIdAndUpdate(id, { title }, { new: true, runValidators: true });
    return updatedRow;
};
