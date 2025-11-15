/**
 * Groups asks by artikul
 *
 * @param asks - Array of asks to group
 * @returns Map<string, IAsk[]> - Map of artikul to asks array
 */
export const groupAsksByArtikulUtil = (asks) => {
    const asksByArtikul = new Map();
    for (const ask of asks) {
        if (!asksByArtikul.has(ask.artikul)) {
            asksByArtikul.set(ask.artikul, []);
        }
        asksByArtikul.get(ask.artikul)?.push(ask);
    }
    return asksByArtikul;
};
