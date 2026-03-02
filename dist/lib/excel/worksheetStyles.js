const HEADER_FILL_ARGB = "FFE0E0E0";
const HEADER_FONT_ARGB = "FF1F2937";
const ZEBRA_FILL_ARGB = "FFF9FAFB";
const thinBorder = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
};
/**
 * Applies shared header row style: light gray fill, bold dark font, thin borders.
 * @param worksheet - ExcelJS worksheet
 * @param columnCount - number of columns to style (1-based)
 */
export function applyHeaderStyle(worksheet, columnCount) {
    const row = worksheet.getRow(1);
    for (let c = 1; c <= columnCount; c++) {
        const cell = row.getCell(c);
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: HEADER_FILL_ARGB },
        };
        cell.font = {
            bold: true,
            color: { argb: HEADER_FONT_ARGB },
        };
        cell.border = thinBorder;
    }
}
/**
 * Applies data row style: thin borders and optional zebra striping.
 * @param worksheet - ExcelJS worksheet
 * @param rowNumber - 1-based row index (data rows typically start at 2)
 * @param columnCount - number of columns to style
 */
export function applyDataRowStyle(worksheet, rowNumber, columnCount) {
    const row = worksheet.getRow(rowNumber);
    const isZebra = (rowNumber - 2) % 2 === 1; // row 2 = 0, row 3 = 1, ...
    for (let c = 1; c <= columnCount; c++) {
        const cell = row.getCell(c);
        cell.border = thinBorder;
        if (isZebra) {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: ZEBRA_FILL_ARGB },
            };
        }
    }
}
