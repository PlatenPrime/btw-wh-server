import { Pos } from "../../../models/Pos.js";
import { getPalletDataUtil } from "./getPalletDataUtil.js";
import { getRowDataUtil } from "./getRowDataUtil.js";
/**
 * Создаёт позицию с subdocuments для palletData и rowData
 */
export const createPosUtil = async ({ pallet, row, artikul, nameukr, quant, boxes, date, sklad, comment, session, }) => {
    const palletData = getPalletDataUtil(pallet);
    const rowData = getRowDataUtil(row);
    const [createdPos] = await Pos.create([
        {
            pallet: pallet._id,
            row: row._id,
            palletTitle: pallet.title,
            rowTitle: row.title,
            palletData,
            rowData,
            artikul,
            nameukr,
            quant,
            boxes,
            date,
            sklad,
            comment,
        },
    ], { session });
    return createdPos;
};
