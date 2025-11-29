import { IArt } from "../../../models/Art.js";
import { ExcelArtRowExtended } from "./types.js";

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
    const stocks = posesQuantMap.get(art.artikul) ?? 0;

    // Получаем btradeStock.value (0 если нет)
    const btradeStockValue = art.btradeStock?.value ?? 0;

    // Рассчитываем витрину: btradeStock.value - Запасы
    const shelf = btradeStockValue - stocks;

    return {
      Артикул: art.artikul,
      Факт: "",
      Вітрина: shelf,
      Сайт: btradeStockValue,
      Склад: stocks,
      "Назва (укр)": art.nameukr || "",
      Зона: art.zone,
      Ліміт: art.limit ?? "",
      Маркер: art.marker || "",
      "Дата зрізу": art.btradeStock?.date
        ? new Date(art.btradeStock.date).toLocaleDateString("uk-UA")
        : "",
    };
  });
};
