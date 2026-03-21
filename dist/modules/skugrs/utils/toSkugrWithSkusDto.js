export const toSkugrWithSkusDto = (skugr, orderedSkus) => ({
    _id: skugr._id.toString(),
    konkName: skugr.konkName,
    prodName: skugr.prodName,
    title: skugr.title,
    url: skugr.url,
    skus: orderedSkus,
    createdAt: skugr.createdAt,
    updatedAt: skugr.updatedAt,
});
