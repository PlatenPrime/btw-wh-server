import { Pos } from "../../../../poses/models/Pos.js";
import { Pallet } from "../../../models/Pallet.js";
export const deletePalletEmptyPosesUtil = async ({ palletId, session, }) => {
    const pallet = await Pallet.findById(palletId).session(session);
    if (!pallet) {
        throw new Error("Pallet not found");
    }
    // Поиск пустых poses
    const emptyPoses = await Pos.find({
        "palletData._id": palletId,
        quant: 0,
        boxes: 0,
    }).session(session);
    if (emptyPoses.length === 0) {
        return {
            deletedCount: 0,
            affectedPoseIds: [],
        };
    }
    // Получение ID пустых poses
    const emptyPoseIds = emptyPoses.map((pose) => pose._id);
    // Удаление пустых poses
    const deleteResult = await Pos.deleteMany({
        "palletData._id": palletId,
        quant: 0,
        boxes: 0,
    }).session(session);
    // Обновление паллеты - удаление ссылок на удалённые poses
    pallet.poses = pallet.poses.filter((poseId) => !emptyPoseIds.some((deletedId) => deletedId.equals(poseId)));
    await pallet.save({ session });
    return {
        deletedCount: deleteResult.deletedCount || 0,
        affectedPoseIds: emptyPoseIds.map((id) => id.toString()),
    };
};
