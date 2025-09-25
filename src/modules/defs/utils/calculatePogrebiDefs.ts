import { getPogrebiDefStocks } from "../../poses/utils/getPogrebiDefStocks.js";
import { getSharikStocks } from "../../poses/utils/getSharikStocks.js";
import { filterDeficits } from "./filterDeficits.js";
import { getArtLimits } from "./getArtLimits.js";

export async function calculatePogrebiDefs() {
  const pogrebiDefStocks = await getPogrebiDefStocks();
  const artikuls = Object.keys(pogrebiDefStocks);
  const limits = await getArtLimits(artikuls);
  const defs = await getSharikStocks(pogrebiDefStocks, limits);
  const filteredDefs = filterDeficits(defs);

  return filteredDefs;
}
