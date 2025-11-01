/**
 * Формирует palletData subdocument для позиции из объекта паллета
 */
export const getPalletDataUtil = (pallet) => {
    return {
        _id: pallet._id,
        title: pallet.title,
        sector: pallet.sector,
        isDef: pallet.isDef,
    };
};
