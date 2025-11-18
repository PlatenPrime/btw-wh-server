type RawPos = {
  artikul: string;
  nameukr?: string;
  quant: number;
  sklad?: string | null;
};

export type ExcelPosRow = {
  Артикул: string;
  "Название (укр)": string;
  Склад: string;
  Количество: number;
};

const DEFAULT_SKLAD_LABEL = "Не указан";

/**
 * Форматирует позиции для экспорта в Excel.
 * Объединяет все позиции с одинаковым артикулом в одну строку
 * и суммирует их остатки.
 */
export const formatPosesStocksForExcelUtil = (
  poses: RawPos[]
): ExcelPosRow[] => {
  const aggregated = poses.reduce<
    Map<
      string,
      {
        artikul: string;
        nameukr: string;
        quant: number;
        sklads: Set<string>;
      }
    >
  >((acc, pos) => {
    const artikul = pos.artikul?.trim();
    const quant = Number(pos.quant ?? 0);

    if (!artikul || quant <= 0) {
      return acc;
    }

    const key = artikul.toLowerCase();
    const normalizedName = pos.nameukr?.trim() ?? "";
    const normalizedSklad =
      pos.sklad?.trim() && pos.sklad.trim().length > 0
        ? pos.sklad.trim()
        : DEFAULT_SKLAD_LABEL;

    const existing = acc.get(key);

    if (existing) {
      existing.quant += quant;
      if (!existing.nameukr && normalizedName) {
        existing.nameukr = normalizedName;
      }
      existing.sklads.add(normalizedSklad);
      return acc;
    }

    acc.set(key, {
      artikul,
      nameukr: normalizedName,
      quant,
      sklads: new Set([normalizedSklad]),
    });

    return acc;
  }, new Map());

  return Array.from(aggregated.values())
    .sort((a, b) => a.artikul.localeCompare(b.artikul, "uk"))
    .map((item) => ({
      Артикул: item.artikul,
      "Название (укр)": item.nameukr,
      Склад: Array.from(item.sklads).join(", "),
      Количество: item.quant,
    }));
};


