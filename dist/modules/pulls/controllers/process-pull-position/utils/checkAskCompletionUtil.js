import { getProcessedQuantFromActionsUtil } from "./getProcessedQuantFromActionsUtil.js";
/**
 * Checks if ask is fully completed based on processed quantity
 * For asks with quant: checks if processedQuant >= requestedQuant
 * For asks without quant: auto-completes if any goods/boxes were pulled (additionalProcessedQuant > 0 OR additionalBoxes > 0)
 *
 * Note: ask.actions should already include the new action being processed
 * (this function is called after action is added)
 *
 * @param ask - Ask to check (should have updated actions array)
 * @param additionalProcessedQuant - Additional quantity being processed now
 * @param additionalBoxes - Additional boxes being processed now
 * @returns boolean - True if ask should be completed
 */
export const checkAskCompletionUtil = (ask, additionalProcessedQuant, additionalBoxes = 0) => {
    // If ask has no quant specified, auto-complete if any goods or boxes were pulled
    if (!ask.quant || ask.quant <= 0) {
        return additionalProcessedQuant > 0 || additionalBoxes > 0;
    }
    // Calculate total processed from actions (which should already include the new action)
    const totalProcessed = getProcessedQuantFromActionsUtil(ask.actions);
    // Check if total processed meets or exceeds requested quantity
    return totalProcessed >= ask.quant;
};
