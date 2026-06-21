import { getAllRowsUtil } from "./utils/getAllRowsUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
export const getAllRows = async (req, res) => {
    try {
        const rows = await getAllRowsUtil();
        if (!rows || rows.length === 0) {
            res.status(404).json({ message: "Rows not found" });
            return;
        }
        res.status(200).json(rows);
    }
    catch (error) {
        logModuleError("rows", error, "Error fetching rows:");
        if (!res.headersSent) {
            res.status(500).json({ message: "Server error", error });
        }
    }
};
