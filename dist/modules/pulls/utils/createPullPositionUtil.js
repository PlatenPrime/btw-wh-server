const extractRequestedQuant = (ask) => {
    const { quant } = ask;
    if (typeof quant !== "number") {
        return null;
    }
    return quant > 0 ? quant : null;
};
/**
 * Creates a pull position object enriched with ask progress data
 */
export const createPullPositionUtil = ({ position, ask, plannedQuant, }) => {
    const totalRequestedQuant = extractRequestedQuant(ask);
    const alreadyPulledQuant = typeof ask.pullQuant === "number" ? Math.max(ask.pullQuant, 0) : 0;
    const alreadyPulledBoxes = typeof ask.pullBox === "number" ? Math.max(ask.pullBox, 0) : 0;
    return {
        posId: position._id,
        artikul: position.artikul,
        nameukr: position.nameukr,
        currentQuant: position.quant,
        currentBoxes: position.boxes,
        plannedQuant,
        totalRequestedQuant,
        alreadyPulledQuant,
        alreadyPulledBoxes,
        askId: ask._id,
        askerData: ask.askerData,
    };
};
