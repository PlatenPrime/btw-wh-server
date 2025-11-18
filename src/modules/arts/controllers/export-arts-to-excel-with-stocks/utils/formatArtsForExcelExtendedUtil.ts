import { IArt } from "../../../models/Art.js";

type ExcelArtRowExtended = {
  Артикул: string;
  "Название (укр)": string;
  "Название (рус)": string;
  Зона: string;
  Лимит: number | string;
  Маркер: string;
  "Btrade Stock": number | string;
  "Дата Btrade Stock": string;
  Запасы: number;
  Витрина: number;
  "Дата создания": string;
  "Дата обновления": string;
};

/**
 * Форматирует артикулы для расширенного экспорта в Excel
 * Включает все колонки из базового экспорта + Запасы и Витрина
 * @param arts - массив артикулов
 * @param posesQuantMap - Map с суммами quant по artikul
 * @returns массив отформатированных данных для Excel
 */
export const formatArtsForExcelExtendedUtil = (
  arts: IArt[],
  posesQuantMap: Map<string, number>
): ExcelArtRowExtended[] => {
  return arts.map((art) => {
    // Получаем запасы из Map (0 если нет позиций)
    const запасы = posesQuantMap.get(art.artikul) ?? 0;

    // Получаем btradeStock.value (0 если нет)
    const btradeStockValue = art.btradeStock?.value ?? 0;

    // Рассчитываем витрину: btradeStock.value - Запасы
    const витрина = btradeStockValue - запасы;

    return {
      Артикул: art.artikul,
      "Название (укр)": art.nameukr || "",
      "Название (рус)": art.namerus || "",
      Зона: art.zone,
      Лимит: art.limit ?? "",
      Маркер: art.marker || "",
      "Btrade Stock": btradeStockValue,
      "Дата Btrade Stock": art.btradeStock?.date
        ? new Date(art.btradeStock.date).toLocaleDateString("ru-RU")
        : "",
      Запасы: запасы,
      Витрина: витрина,
      "Дата создания": art.createdAt
        ? new Date(art.createdAt).toLocaleDateString("ru-RU")
        : "",
      "Дата обновления": art.updatedAt
        ? new Date(art.updatedAt).toLocaleDateString("ru-RU")
        : "",
    };
  });
};

