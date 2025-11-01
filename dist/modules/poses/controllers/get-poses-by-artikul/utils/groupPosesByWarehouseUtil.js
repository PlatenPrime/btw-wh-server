/**
 * Группирует позиции по складам (pogrebi, merezhi, other)
 */
export const groupPosesByWarehouseUtil = (poses) => {
    const pogrebi = [];
    const merezhi = [];
    const other = [];
    poses.forEach((pos) => {
        const sklad = pos.sklad?.toLowerCase();
        if (sklad === "pogrebi") {
            pogrebi.push(pos);
        }
        else if (sklad === "merezhi") {
            merezhi.push(pos);
        }
        else {
            other.push(pos);
        }
    });
    return { pogrebi, merezhi, other };
};
