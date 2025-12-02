export const getAsksStatisticsUtil = (asks) => {
    const newCount = asks.filter((ask) => ask.status === "new").length;
    const processingCount = asks.filter((ask) => ask.status === "processing").length;
    const completedCount = asks.filter((ask) => ask.status === "completed").length;
    const rejectedCount = asks.filter((ask) => ask.status === "rejected").length;
    return {
        newCount,
        processingCount,
        completedCount,
        rejectedCount,
    };
};
