import { IArt } from "../../../models/Art.js";

type ExcelArtRow = {
  Артикул: string;
  "Название (укр)": string;
  "Название (рус)": string;
  Зона: string;
  Лимит: number | string;
  Маркер: string;
  "Btrade Stock": number | string;
  "Дата Btrade Stock": string;
  "Дата создания": string;
  "Дата обновления": string;
};

/**
 * Форматирует артикулы для экспорта в Excel
 * @param arts - массив артикулов
 * @returns массив отформатированных данных для Excel
 */
export const formatArtsForExcelUtil = (
  arts: IArt[]
): ExcelArtRow[] => {
  return arts.map((art) => ({
    Артикул: art.artikul,
    "Название (укр)": art.nameukr || "",
    "Название (рус)": art.namerus || "",
    Зона: art.zone,
    Лимит: art.limit ?? "",
    Маркер: art.marker || "",
    "Btrade Stock": art.btradeStock?.value ?? "",
    "Дата Btrade Stock": art.btradeStock?.date
      ? new Date(art.btradeStock.date).toLocaleDateString("ru-RU")
      : "",
    "Дата создания": art.createdAt
      ? new Date(art.createdAt).toLocaleDateString("ru-RU")
      : "",
    "Дата обновления": art.updatedAt
      ? new Date(art.updatedAt).toLocaleDateString("ru-RU")
      : "",
  }));
};

