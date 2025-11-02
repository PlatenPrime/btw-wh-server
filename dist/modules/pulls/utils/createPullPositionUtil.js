/**
 * Creates a pull position object
 *
 * @param position - Source position
 * @param ask - Associated ask
 * @param requestedQuant - Quantity to request from this position
 * @returns IPullPosition - Created pull position
 */
export const createPullPositionUtil = (position, ask, requestedQuant) => {
    return {
        posId: position._id,
        artikul: position.artikul,
        nameukr: position.nameukr,
        currentQuant: position.quant,
        currentBoxes: position.boxes,
        requestedQuant,
        askId: ask._id,
        askerData: ask.askerData,
    };
};
