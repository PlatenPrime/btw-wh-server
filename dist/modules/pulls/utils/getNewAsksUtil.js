import { Ask } from "../../asks/models/Ask.js";
/**
 * Gets all asks with "new" status
 *
 * @returns Promise<IAsk[]> - Array of new asks
 */
const isPositiveNumber = (value) => typeof value === "number" && !Number.isNaN(value) && value > 0;
const hasAnyPulls = (ask) => {
    const pulledQuant = isPositiveNumber(ask.pullQuant) ? ask.pullQuant : 0;
    const pulledBoxes = isPositiveNumber(ask.pullBox) ? ask.pullBox : 0;
    return pulledQuant > 0 || pulledBoxes > 0;
};
const needsFulfillment = (ask) => {
    if (isPositiveNumber(ask.quant)) {
        const requestedQuant = ask.quant;
        const pulledQuant = isPositiveNumber(ask.pullQuant) ? ask.pullQuant : 0;
        return pulledQuant < requestedQuant;
    }
    return !hasAnyPulls(ask);
};
export const getNewAsksUtil = async () => {
    const newAsks = (await Ask.find({ status: "new" }).lean());
    if (newAsks.length === 0) {
        return [];
    }
    return newAsks.filter(needsFulfillment);
};
