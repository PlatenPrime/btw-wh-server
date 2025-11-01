import { Types } from "mongoose";
import { Row } from "../../../../rows/models/Row.js";
/**
 * Заполняет rowData и row для позиции
 * Если row отсутствует или невалиден, ищет Row по rowTitle
 */
export const populateRowDataUtil = async (pos) => {
    let rowId = pos.row;
    let rowDoc = null;
    // rowId может быть ObjectId, string или undefined/null
    const rowIdStr = rowId ? rowId.toString() : undefined;
    if (!rowIdStr || !Types.ObjectId.isValid(rowIdStr)) {
        // row отсутствует или невалиден — ищем по rowTitle
        rowDoc = await Row.findOne({ title: pos.rowTitle });
        if (!rowDoc) {
            throw new Error(`Row not found by rowTitle: ${pos.rowTitle}`);
        }
        pos.row = rowDoc._id;
    }
    else {
        rowDoc = await Row.findById(rowIdStr);
        if (!rowDoc) {
            throw new Error(`Row not found by row ObjectId: ${rowIdStr}`);
        }
    }
    pos.rowData = {
        _id: rowDoc._id,
        title: rowDoc.title,
    };
    return rowDoc;
};
