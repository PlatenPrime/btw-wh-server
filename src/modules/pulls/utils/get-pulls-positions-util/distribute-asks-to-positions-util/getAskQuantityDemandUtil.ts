import { IAsk } from "../../../../asks/models/Ask.js";

export const getAskQuantityDemandUtil = (ask: IAsk): number | null => {
  if (typeof ask.quant !== "number" || ask.quant <= 0) {
    return null;
  }

  const currentPull = typeof ask.pullQuant === "number" ? ask.pullQuant : 0;
  const remaining = ask.quant - currentPull;

  return remaining > 0 ? remaining : null;
};