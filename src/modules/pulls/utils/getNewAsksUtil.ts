import { Ask, IAsk } from "../../asks/models/Ask.js";

/**
 * Gets all asks with "new" status
 *
 * @returns Promise<IAsk[]> - Array of new asks
 */
const isPositiveNumber = (value: unknown): value is number =>
  typeof value === "number" && !Number.isNaN(value) && value > 0;

const hasAnyPulls = (ask: IAsk): boolean => {
  const pulledQuant = isPositiveNumber(ask.pullQuant) ? ask.pullQuant : 0;
  const pulledBoxes = isPositiveNumber(ask.pullBox) ? ask.pullBox : 0;

  return pulledQuant > 0 || pulledBoxes > 0;
};

const needsFulfillment = (ask: IAsk): boolean => {
  if (isPositiveNumber(ask.quant)) {
    const requestedQuant = ask.quant;
    const pulledQuant = isPositiveNumber(ask.pullQuant) ? ask.pullQuant : 0;

    return pulledQuant < requestedQuant;
  }

  return !hasAnyPulls(ask);
};

export const getNewAsksUtil = async (): Promise<IAsk[]> => {
  const newAsks = (await Ask.find({ status: "new" }).lean()) as IAsk[];

  if (newAsks.length === 0) {
    return [];
  }

  return newAsks.filter(needsFulfillment);
};
