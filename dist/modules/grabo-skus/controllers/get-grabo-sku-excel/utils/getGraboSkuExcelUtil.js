import { GraboSku } from "../../../models/GraboSku.js";
import { buildGraboSkuExcelBuffer, } from "../../../utils/buildGraboSkuExcel.js";
export async function getGraboSkuExcelUtil() {
    const docs = await GraboSku.find().sort({ productId: 1 }).lean().exec();
    const rows = docs.map((doc) => ({
        productId: doc.productId,
        title: doc.title,
        url: doc.url,
        isNewProduct: doc.isNewProduct,
        color: doc.color,
        size: doc.size,
        material: doc.material,
        gas: doc.gas,
        language: doc.language,
        gasCapacity: doc.gasCapacity,
        tags: doc.tags,
        images: doc.images,
        isOnSite: doc.isOnSite,
        lastSeenAt: doc.lastSeenAt,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    }));
    return buildGraboSkuExcelBuffer(rows);
}
