export const getRejectAskMesUtil = ({ ask, solverName, }) => {
    const message = `❌ Ваш запит відхилено

📦 ${ask.artikul}
📝 ${ask.nameukr || "—"}
🔢 ${ask.quant ?? "—"}
👤 Відхилив: ${solverName}`;
    return message;
};
