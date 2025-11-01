import { createPosUtil } from "../../create-pos/utils/createPosUtil.js";
import { validatePalletsAndRowsUtil } from "./validatePalletsAndRowsUtil.js";
/**
 * Массово создаёт позиции и обновляет связанные паллеты
 */
export const bulkCreatePosesUtil = async ({ poses, session, }) => {
    // Валидация паллетов и рядов
    const { pallets, rows } = await validatePalletsAndRowsUtil({ poses, session });
    const createdPoses = [];
    const palletUpdates = new Map();
    // Создаём позиции
    for (const posData of poses) {
        const pallet = pallets.find((p) => p._id.toString() === posData.palletId);
        const row = rows.find((r) => r._id.toString() === posData.rowId);
        if (!pallet || !row) {
            throw new Error("Pallet or row not found during creation");
        }
        const createdPos = await createPosUtil({
            ...posData,
            pallet,
            row,
            session,
        });
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
    return createdPoses;
};
