import ExcelJS from "exceljs";
const META_HEADERS = [
    "Назва",
    "Посилання",
    "Ідентифікатор товару",
    "Конкурент",
    "Виробник",
];
export function formatDateHeader(d) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
function enumerateSliceDates(from, to) {
    const out = [];
    const cursor = new Date(from);
    while (cursor.getTime() <= to.getTime()) {
        out.push(new Date(cursor));
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return out;
}
export function safeFilePart(s) {
    return s.replace(/[^a-zA-Z0-9_-]/g, "_");
}
/**
 * Таблица: метаданные SKU + колонки по датам (залишок, ціна), блоками по 2 строки на SKU.
 */
export async function buildSkuSliceExcelForSkus(skus, dateFrom, dateTo, getItem) {
    const dates = enumerateSliceDates(dateFrom, dateTo);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Срез");
    const header = sheet.addRow([
        ...META_HEADERS,
        ...dates.map((d) => formatDateHeader(d)),
    ]);
    header.font = { bold: true };
    for (let s = 0; s < skus.length; s++) {
        const sku = skus[s];
        const stocks = [];
        const prices = [];
        for (const d of dates) {
            const item = getItem(sku.konkName, sku.productId, d);
            stocks.push(item != null ? item.stock : "");
            prices.push(item != null ? item.price : "");
        }
        sheet.addRow([
            sku.title,
            sku.url,
            sku.productId,
            sku.konkName,
            sku.prodName,
            ...stocks,
        ]);
        sheet.addRow(["", "", "", "", "", ...prices]);
        if (s < skus.length - 1) {
            sheet.addRow([]);
        }
    }
    const buf = await workbook.xlsx.writeBuffer();
    const fromS = formatDateHeader(dateFrom);
    const toS = formatDateHeader(dateTo);
    const nameBase = skus.length === 1
        ? `sku_slice_${safeFilePart(skus[0].productId)}_${fromS}_${toS}`
        : `sku_slice_konk_${fromS}_${toS}`;
    return {
        buffer: Buffer.from(buf),
        fileName: `${nameBase}.xlsx`,
    };
}
