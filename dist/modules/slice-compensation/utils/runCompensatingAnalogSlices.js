import { Analog } from "../../analogs/models/Analog.js";
import { getAnalogStockDataUtil } from "../../analogs/controllers/get-analog-stock/utils/getAnalogStockDataUtil.js";
import { AnalogSlice } from "../../analog-slices/models/AnalogSlice.js";
import { getExcludedCompetitorSet } from "../../slices/config/excludedCompetitors.js";
import { buildCompensatingDataKeyQueue, runCompensatingSliceRefetchLoop, } from "./compensatingSliceRunner.js";
import { isFullMinusOneSliceStockResult } from "../../slices/utils/isInvalidSliceStockResult.js";
import { isFullMinusOneSliceItem } from "./isFullMinusOneSliceItem.js";
import { logModuleError, logModuleInfo, logModuleWarn, } from "../../../logging/logModuleError.js";
/**
 * Повторный опрос позиций AnalogSlice за sliceDate с data entry stock/price оба -1.
 * При ответе, где уже не оба -1, перезаписывает ключ в том же документе.
 */
export async function runCompensatingAnalogSlices(sliceDate, options) {
    const excluded = getExcludedCompetitorSet("analogSlices");
    const filter = { date: sliceDate };
    if (options?.konkName) {
        filter.konkName = options.konkName;
    }
    const docs = (await AnalogSlice.find(filter)
        .select("konkName data")
        .lean());
    const queue = buildCompensatingDataKeyQueue(docs, excluded, isFullMinusOneSliceItem);
    return runCompensatingSliceRefetchLoop(queue, async ({ konkName, dataKey }) => {
        const artikulKey = dataKey;
        try {
            const analog = (await Analog.findOne({ konkName, artikul: artikulKey })
                .select("_id")
                .lean());
            if (!analog) {
                logModuleWarn("slice-compensation", "compensating analog: entity not found, skip", { konkName, artikulKey });
                return { refetched: 0, updated: 0 };
            }
            const result = await getAnalogStockDataUtil(analog._id.toString());
            if (!result) {
                logModuleInfo("slice-compensation", "compensating analog refetch empty", {
                    konkName,
                    artikulKey,
                    kind: "analog",
                });
                return { refetched: 0, updated: 0 };
            }
            let updated = 0;
            if (!isFullMinusOneSliceStockResult(result)) {
                const dataItem = {
                    stock: result.stock,
                    price: result.price,
                    artikul: artikulKey,
                };
                await AnalogSlice.findOneAndUpdate({ konkName, date: sliceDate }, { $set: { [`data.${artikulKey}`]: dataItem } });
                updated = 1;
            }
            logModuleInfo("slice-compensation", "compensating analog refetch result", {
                konkName,
                artikulKey,
                kind: "analog",
                stock: result.stock,
                price: result.price,
                updated: updated === 1,
            });
            return { refetched: 1, updated };
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            logModuleError("slice-compensation", err, "compensating analog slice refetch failed", {
                konkName,
                artikulKey,
                message: msg,
            });
            return { refetched: 0, updated: 0 };
        }
    });
}
