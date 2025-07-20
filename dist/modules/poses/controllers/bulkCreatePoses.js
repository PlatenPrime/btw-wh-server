import mongoose from "mongoose";
import { z } from "zod";
import { Pallet } from "../../pallets/models/Pallet.js";
import { Row } from "../../rows/models/Row.js";
import { createPosSchema } from "../createPosSchema.js";
import { Pos } from "../models/Pos.js";
const bulkCreatePosesSchema = z.object({
    poses: z.array(createPosSchema).min(1, "At least one position is required"),
});
export const bulkCreatePoses = async (req, res) => {
    // Zod validation OUTSIDE try/catch
    const parseResult = bulkCreatePosesSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.errors });
        return;
    }
    const { poses } = parseResult.data;
    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const createdPoses = [];
            const palletUpdates = new Map();
            // Проверяем существование всех паллетов и рядов
            const palletIds = [...new Set(poses.map((p) => p.palletId))];
            const rowIds = [...new Set(poses.map((p) => p.rowId))];
            const pallets = await Pallet.find({ _id: { $in: palletIds } }).session(session);
            const rows = await Row.find({ _id: { $in: rowIds } }).session(session);
            if (pallets.length !== palletIds.length) {
                res.status(404).json({ error: "Some pallets not found" });
                return;
            }
            if (rows.length !== rowIds.length) {
                res.status(404).json({ error: "Some rows not found" });
                return;
            }
            // Создаем позиции
            for (const posData of poses) {
                const pallet = pallets.find((p) => p._id.toString() === posData.palletId);
                const row = rows.find((r) => r._id.toString() === posData.rowId);
                const [createdPos] = await Pos.create([
                    {
                        pallet: pallet._id,
                        row: row._id,
                        palletData: {
                            _id: pallet._id,
                            title: pallet.title,
                            sector: pallet.sector,
                        },
                        rowData: {
                            _id: row._id,
                            title: row.title,
                        },
                        palletTitle: pallet.title,
                        rowTitle: row.title,
                        artikul: posData.artikul,
                        nameukr: posData.nameukr,
                        quant: posData.quant,
                        boxes: posData.boxes,
                        date: posData.date,
                        sklad: posData.sklad,
                        comment: posData.comment,
                    },
                ], { session });
                createdPoses.push(createdPos);
                // Собираем обновления для паллетов
                if (!palletUpdates.has(posData.palletId)) {
                    palletUpdates.set(posData.palletId, []);
                }
                palletUpdates
                    .get(posData.palletId)
                    .push(createdPos._id);
            }
            // Обновляем паллеты
            for (const [palletId, posIds] of palletUpdates) {
                const pallet = pallets.find((p) => p._id.toString() === palletId);
                if (pallet) {
                    pallet.poses.push(...posIds);
                    await pallet.save({ session });
                }
            }
            res.status(201).json({
                message: `${createdPoses.length} positions created successfully`,
                data: createdPoses,
            });
        });
    }
    catch (error) {
        if (!res.headersSent) {
            res
                .status(500)
                .json({ error: "Failed to create positions", details: error });
        }
    }
    finally {
        await session.endSession();
    }
};
