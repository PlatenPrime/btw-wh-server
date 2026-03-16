/**
 * Build a reusable short DTO representation for a pallet.
 */
export const mapPalletToShortDto = (pallet) => {
    return {
        id: pallet._id.toString(),
        title: pallet.title,
        sector: pallet.sector,
        isDef: pallet.isDef,
        isEmpty: pallet.poses.length === 0,
        palgrId: pallet.palgr?.id?.toString() ?? undefined,
        palgrTitle: pallet.palgr?.title ?? undefined,
    };
};
