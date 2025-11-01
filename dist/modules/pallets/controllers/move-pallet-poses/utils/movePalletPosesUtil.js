import { Pos } from "../../../../poses/models/Pos.js";
import { Pallet } from "../../../models/Pallet.js";
import { Row } from "../../../../rows/models/Row.js";
import { serializeIds } from "../../../utils/serialize-ids.js";
export const movePalletPosesUtil = async ({ sourcePalletId, targetPalletId, session, }) => {
    // Получение паллет
    const [sourcePallet, targetPallet] = await Promise.all([
        Pallet.findById(sourcePalletId).session(session),
        Pallet.findById(targetPalletId).session(session),
    ]);
    if (!sourcePallet) {
        throw new Error("Source pallet not found");
    }
    if (!targetPallet) {
        throw new Error("Target pallet not found");
    }
    // Проверка что целевая паллета пустая
    if (!Array.isArray(targetPallet.poses) || targetPallet.poses.length > 0) {
        throw new Error("Target pallet must be empty");
    }
    // Проверка что в исходной паллете есть poses
    if (!Array.isArray(sourcePallet.poses) || sourcePallet.poses.length === 0) {
        throw new Error("Source pallet has no poses to move");
    }
    // Получение целевого ряда
    const targetRow = await Row.findById(targetPallet.row).session(session);
    if (!targetRow) {
        throw new Error("Target row not found");
    }
    // Получение poses для перемещения
    const posesToMove = await Pos.find({
        _id: { $in: sourcePallet.poses },
    }).session(session);
    // Обновление данных в Pos
    for (const pos of posesToMove) {
        pos.palletData = {
            _id: targetPallet._id,
            title: targetPallet.title,
            sector: targetPallet.sector,
            isDef: targetPallet.isDef,
        };
        pos.rowData = {
            _id: targetRow._id,
            title: targetRow.title,
        };
        pos.palletTitle = targetPallet.title;
        pos.rowTitle = targetRow.title;
        pos.pallet = targetPallet._id;
        pos.row = targetRow._id;
        await pos.save({ session });
    }
    // Обновление паллет
    targetPallet.poses = sourcePallet.poses;
    sourcePallet.poses = [];
    await Promise.all([
        targetPallet.save({ session }),
        sourcePallet.save({ session }),
    ]);
    return {
        targetPallet: serializeIds(targetPallet.toObject()),
    };
};
