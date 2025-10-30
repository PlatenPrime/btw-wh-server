export const getCreateAskMessageUtil = ({ askerData, artikul, nameukr, quant, com }) => {
    return `🆕 Новий запит

  👤 ${askerData.fullname}
  📦 ${artikul}
  📝 ${nameukr || "—"}
  🔢 ${quant || "—"}
  💬 ${com || "—"}
`;
};
