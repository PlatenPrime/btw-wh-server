import { logModuleError } from "../../../../logging/logModuleError.js";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
import { releaseCompensatingRun, tryAcquireCompensatingRun, } from "../../utils/compensatingRunStatus.js";
import { runCompensatingSlicesForKonk } from "../../utils/runCompensatingSlicesForKonk.js";
import { runCompensatingSliceSchema } from "./schemas/runCompensatingSliceSchema.js";
/**
 * @desc    Внеочередной compensating refetch AnalogSlice + SkuSlice для одного konk (сегодня)
 * @route   POST /api/slice-compensation/run
 * @access  ADMIN
 */
export async function runCompensatingSliceController(req, res) {
    const parseResult = runCompensatingSliceSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).json({
            message: "Validation error",
            errors: parseResult.error.errors,
        });
        return;
    }
    const { konkName } = parseResult.data;
    if (!tryAcquireCompensatingRun(konkName)) {
        res.status(409).json({
            message: "Compensating slice already running for this competitor",
        });
        return;
    }
    try {
        const result = await runCompensatingSlicesForKonk(konkName);
        if (req.user?.id) {
            await createEventUtil({
                userId: req.user.id,
                department: "slice-compensation",
                description: `Запущено позачерговий компенсуючий забір слайсів для конкурента ${result.konkName}`,
            });
        }
        res.status(200).json({
            message: "Compensating slice completed",
            data: {
                konkName: result.konkName,
                sliceDate: result.sliceDate.toISOString().slice(0, 10),
                analog: result.analog,
                sku: result.sku,
            },
        });
    }
    catch (error) {
        logModuleError("slice-compensation", error, "Error in runCompensatingSliceController:");
        if (!res.headersSent) {
            res.status(500).json({
                message: "Failed to run compensating slice",
            });
        }
    }
    finally {
        releaseCompensatingRun(konkName);
    }
}
