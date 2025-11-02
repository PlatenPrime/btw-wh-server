/**
 * Extracts processed quantity from ask actions
 * Parses actions that match pattern: "знято X шт. з паллети ..."
 *
 * @param actions - Array of action strings
 * @returns number - Total processed quantity
 */
export const getProcessedQuantFromActionsUtil = (actions) => {
    let totalProcessed = 0;
    for (const action of actions) {
        // Pattern: "DD.MM.YYYY HH:MM Name: знято X шт. з паллети ..."
        const match = action.match(/знято\s+(\d+)\s+шт\./);
        if (match) {
            const quant = parseInt(match[1], 10);
            if (!isNaN(quant)) {
                totalProcessed += quant;
            }
        }
    }
    return totalProcessed;
};
