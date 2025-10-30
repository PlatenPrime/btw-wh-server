export const getCompleteAskMesUtil = ({ ask, solverName, }) => {
    const message = `✅ Ваш запит виконано!

        📦 ${ask.artikul}
        📝 ${ask.nameukr || "—"}
        🔢 ${ask.quant ?? "—"}
        👤 Виконавець: ${solverName}`;
    return message;
};
