/**
 * Форматирует артикулы для экспорта в Excel
 * @param arts - массив артикулов
 * @returns массив отформатированных данных для Excel
 */
export const formatArtsForExcelUtil = (arts) => {
    return arts.map((art) => ({
        Артикул: art.artikul,
        Виробник: art.prodName || "",
        "Назва (укр)": art.nameukr || "",
        "Назва (рус)": art.namerus || "",
        Зона: art.zone,
        Ліміт: art.limit ?? "",
        Маркер: art.marker || "",
        ABC: art.abc || "",
        "Залишки на сайті": art.btradeStock?.value ?? "",
        "Дата оновлення залишків": art.btradeStock?.date ? new Date(art.btradeStock.date).toLocaleDateString("uk-UA") : "",
    }));
};
