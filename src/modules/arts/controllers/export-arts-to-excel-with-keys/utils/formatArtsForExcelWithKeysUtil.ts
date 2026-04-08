import { IArt } from "../../../models/Art.js";
import { ExcelArtKeyRow } from "./types.js";

/**
 * Форматирует артикулы для key-based экспорта в Excel.
 */
export const formatArtsForExcelWithKeysUtil = (arts: IArt[]): ExcelArtKeyRow[] => {
  return arts.map((art) => ({
    artikul: art.artikul,
    prodName: art.prodName || "",
    nameukr: art.nameukr || "",
    namerus: art.namerus || "",
    zone: art.zone,
    limit: art.limit ?? "",
    marker: art.marker || "",
    abc: art.abc || "",
  }));
};

