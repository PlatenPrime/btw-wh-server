import { createLogger } from "../../../logging/createLogger.js";
import { releaseCompensatingRun, tryAcquireCompensatingRun, } from "./compensatingRunStatus.js";
import { runCompensatingSlicesForKonk } from "./runCompensatingSlicesForKonk.js";
const log = createLogger({ module: "slice-compensation", job: "manual" });
/**
 * Локальный/отладочный прогон compensating slice (lock + analog/sku refetch за сегодня).
 * Для разового вызова после mongoose.connect без HTTP/JWT.
 */
export async function runManualCompensatingSlice(konkName) {
    if (!tryAcquireCompensatingRun(konkName)) {
        log.warn({ konkName }, "compensating slice already running");
        return;
    }
    try {
        const result = await runCompensatingSlicesForKonk(konkName);
        log.info({
            konkName: result.konkName,
            sliceDate: result.sliceDate.toISOString().slice(0, 10),
            analog: result.analog,
            sku: result.sku,
        }, "manual compensating slice done");
    }
    catch (err) {
        log.error({ err, konkName }, "manual compensating slice failed");
    }
    finally {
        releaseCompensatingRun(konkName);
    }
}
