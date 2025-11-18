import * as XLSX from "xlsx";
export const generateExcelUtil = (excelData, sklad) => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet["!cols"] = [
        { wch: 20 }, // Артикул
        { wch: 40 }, // Название (укр)
        { wch: 20 }, // Склад
        { wch: 15 }, // Количество
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, "Остатки");
    const buffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
    });
    const fileName = `poses_stocks_${(sklad ?? "all").toLowerCase()}_${new Date().toISOString().split("T")[0]}.xlsx`;
    return { buffer, fileName };
};
