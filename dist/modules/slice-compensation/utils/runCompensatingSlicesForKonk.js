import { normalizeCompetitorName } from "../../slices/config/excludedCompetitors.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import { runCompensatingAnalogSlices } from "./runCompensatingAnalogSlices.js";
import { runCompensatingSkuSlices } from "./runCompensatingSkuSlices.js";
/**
 * Внеочередная компенсация сегодняшних AnalogSlice + SkuSlice для одного конкурента.
 */
export async function runCompensatingSlicesForKonk(konkName) {
    const normalized = normalizeCompetitorName(konkName);
    const sliceDate = toSliceDate(new Date());
    const [analog, sku] = await Promise.all([
        runCompensatingAnalogSlices(sliceDate, { konkName: normalized }),
        runCompensatingSkuSlices(sliceDate, { konkName: normalized }),
    ]);
    return {
        konkName: normalized,
        sliceDate,
        analog,
        sku,
    };
}
