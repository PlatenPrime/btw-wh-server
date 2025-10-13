import { IArt } from "../models/Art.js";

export function sortArtsByArtikul(arts: IArt[]) {
  return arts.sort((a, b) => a.artikul.localeCompare(b.artikul));
}


