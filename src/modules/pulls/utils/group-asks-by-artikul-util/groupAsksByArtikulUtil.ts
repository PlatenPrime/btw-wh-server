import { IAsk } from "../../../asks/models/Ask.js";

/**
 * Groups asks by artikul
 *
 * @param asks - Array of asks to group
 * @returns Map<string, IAsk[]> - Map of artikul to asks array
 */
export const groupAsksByArtikulUtil = (asks: IAsk[]): Map<string, IAsk[]> => {
  const asksByArtikul = new Map<string, IAsk[]>();

  for (const ask of asks) {
    if (!asksByArtikul.has(ask.artikul)) {
      asksByArtikul.set(ask.artikul, []);
    }

    asksByArtikul.get(ask.artikul)?.push(ask);
  }

  return asksByArtikul as Map<string, IAsk[]>;
};
