export const updatePosesOnMoveUtil = async ({ posesToMove, targetPallet, targetRow, session, }) => {
    for (const pos of posesToMove) {
        // Обновление данных паллеты
        pos.palletData = {
            _id: targetPallet._id,
            title: targetPallet.title,
            sector: targetPallet.sector,
            isDef: targetPallet.isDef,
        };
        // Обновление данных ряда
        pos.rowData = {
            _id: targetRow._id,
            title: targetRow.title,
        };
        // Обновление кэшированных полей
        pos.palletTitle = targetPallet.title;
        pos.rowTitle = targetRow.title;
        // Обновление для обратной совместимости
        pos.pallet = targetPallet._id;
        pos.row = targetRow._id;
        await pos.save({ session });
    }
};
