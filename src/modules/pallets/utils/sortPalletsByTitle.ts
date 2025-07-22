import { IPallet } from "../models/Pallet.js";

type ShortPalletData = Pick<IPallet, "title">;


export function sortPalletsByTitle (pallets: ShortPalletData[]) {
    return pallets.sort((a, b) => {
        const partsA = a.title.split('-');
        const partsB = b.title.split('-');

        for (let i = 0; i < partsA.length; i++) {
            const numA = parseInt(partsA[i]);
            const numB = parseInt(partsB[i]);

            if (numA < numB) {
                return -1;
            }
            if (numA > numB) {
                return 1;
            }
        }
        return 0;
    });
}

