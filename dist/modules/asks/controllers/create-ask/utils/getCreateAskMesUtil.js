export const getCreateAskMessageUtil = ({ askerData, data, }) => {
    const { artikul, nameukr, quant, com } = data;
    return `🆕 Новий запит

  👤 ${askerData.fullname}
  📦 ${artikul}
  📝 ${nameukr || "—"}
  🔢 ${quant || "—"}
  💬 ${com || "—"}
`;
};
