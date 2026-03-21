import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { computeRevenueForDay, computeSalesFromStockSequence, } from "../../../../analog-slices/controllers/common/salesComparisonUtils.js";
import { toSliceDate } from "../../../../../utils/sliceDate.js";
export async function getSkuSalesByDateUtil(input) {
    const sku = await Sku.findById(input.skuId).select("konkName productId").lean();
    if (!sku)
        return null;
    const productKey = sku.productId?.trim();
    if (!productKey)
        return null;
    const sliceDate = toSliceDate(input.date);
    const prevDate = new Date(sliceDate);
    prevDate.setUTCDate(prevDate.getUTCDate() - 1);
    const [currDoc, prevDoc] = await Promise.all([
        SkuSlice.findOne({
            konkName: sku.konkName,
            date: sliceDate,
        })
            .select("data")
            .lean(),
        SkuSlice.findOne({
            konkName: sku.konkName,
            date: prevDate,
        })
            .select("data")
            .lean(),
    ]);
    const currData = (currDoc?.data ?? {});
    const currItem = currData[productKey];
    if (!currItem)
        return null;
    const prevData = (prevDoc?.data ?? {});
    const prevItem = prevData[productKey];
    const prevStock = prevItem != null ? prevItem.stock : null;
    const currStock = currItem.stock;
    const stockByDay = [prevStock, currStock];
    const salesResults = computeSalesFromStockSequence(stockByDay);
    const dayResult = salesResults[1];
    const revenue = computeRevenueForDay(dayResult.sales, currItem.price);
    return {
        sales: dayResult.sales,
        revenue,
        price: currItem.price,
        isDeliveryDay: dayResult.isDeliveryDay,
    };
}
