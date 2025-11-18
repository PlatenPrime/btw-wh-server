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

type FormatPosesStocksOptions = {
  selectedSklad?: "merezhi" | "pogrebi";
};

const DEFAULT_SKLAD_LABEL = "Не указан";
const SKLAD_LABELS: Record<string, string> = {
  merezhi: "Мережі",
  pogrebi: "Погреби",
};

const normalizeSkladLabel = (value?: string | null): string => {
  const trimmed = value?.trim();

  if (!trimmed) {
    return DEFAULT_SKLAD_LABEL;
  }

  const mapped = SKLAD_LABELS[trimmed.toLowerCase()];

  return mapped ?? trimmed;
};

const buildAggregationKey = (
  artikul: string,
  skladLabel: string,
  selectedSklad?: "merezhi" | "pogrebi"
) => {
  if (selectedSklad) {
    return artikul.toLowerCase();
  }

  return `${artikul.toLowerCase()}::${skladLabel.toLowerCase()}`;
};

/**
 * Форматирует позиции для экспорта в Excel.
 * При выгрузке по конкретному складу суммирует все остатки по артикулу.
 * При выгрузке по всем складам разделяет строки по складам и суммирует
 * остатки отдельно для каждого склада.
 */
export const formatPosesStocksForExcelUtil = (
  poses: RawPos[],
  options: FormatPosesStocksOptions = {}
): ExcelPosRow[] => {
  const aggregated = poses.reduce<
    Map<
      string,
      {
        artikul: string;
        nameukr: string;
        quant: number;
        skladLabel: string;
      }
    >
  >((acc, pos) => {
    const artikul = pos.artikul?.trim();
    const quant = Number(pos.quant ?? 0);

    if (!artikul || quant <= 0) {
      return acc;
    }

    const normalizedName = pos.nameukr?.trim() ?? "";
    const skladLabel = normalizeSkladLabel(pos.sklad);
    const key = buildAggregationKey(artikul, skladLabel, options.selectedSklad);

    const existing = acc.get(key);

    if (existing) {
      existing.quant += quant;
      if (!existing.nameukr && normalizedName) {
        existing.nameukr = normalizedName;
      }
      return acc;
    }

    acc.set(key, {
      artikul,
      nameukr: normalizedName,
      quant,
      skladLabel,
    });

    return acc;
  }, new Map());

  return Array.from(aggregated.values())
    .sort((a, b) => {
      const artikulOrder = a.artikul.localeCompare(b.artikul, "uk");

      if (artikulOrder !== 0) {
        return artikulOrder;
      }

      return a.skladLabel.localeCompare(b.skladLabel, "uk");
    })
    .map((item) => ({
      Артикул: item.artikul,
      "Название (укр)": item.nameukr,
      Склад: item.skladLabel,
      Количество: item.quant,
    }));
};


