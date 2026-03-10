const SHARIK_IMAGE_BASE =
  "https://sharik.ua/images/elements_big";

interface GetCreateKaskMessageInput {
  artikul: string;
  nameukr: string;
  quant?: number;
  zone: string;
  com?: string;
}

/**
 * Текст уведомления в Telegram при создании запроса к кассе.
 * Ссылка на изображение по шаблону sharik.ua с artikul в имени файла.
 */
export const getCreateKaskMessageUtil = ({
  artikul,
  nameukr,
  quant,
  zone,
  com,
}: GetCreateKaskMessageInput): string => {
  const imageUrl = `${SHARIK_IMAGE_BASE}/${encodeURIComponent(artikul)}_m1.jpg`;
  const quantLine =
    quant !== undefined && quant !== null ? `${quant} шт` : "—";

  return `🆕 Новий запит до каси

  📦 ${artikul}
  📝 ${nameukr || "—"}
  🔢 ${quantLine}
  📍 ${zone || "—"}
  💬 ${com != null && com !== "" ? com : "—"}
  🖼 ${imageUrl}
`;
};
