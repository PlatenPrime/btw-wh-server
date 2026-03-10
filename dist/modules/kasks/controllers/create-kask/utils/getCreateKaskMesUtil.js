const SHARIK_IMAGE_BASE = "https://sharik.ua/images/elements_big";
/**
 * Текст уведомления в Telegram при создании запроса к кассе.
 * Ссылка на изображение по шаблону sharik.ua с artikul в имени файла.
 */
export const getCreateKaskMessageUtil = ({ artikul, nameukr, quant, zone, com, }) => {
    const imageUrl = `${SHARIK_IMAGE_BASE}/${encodeURIComponent(artikul)}_m1.jpg`;
    const quantLine = quant !== undefined && quant !== null ? `${quant} шт` : "—";
    return `🆕 Новий запит до каси

  📦 ${artikul}
  📝 ${nameukr || "—"}
  🔢 ${quantLine}
  📍 ${zone || "—"}
  💬 ${com != null && com !== "" ? com : "—"}
  🖼 ${imageUrl}
`;
};
