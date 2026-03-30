export const toSkugrDto = (doc) => ({
    _id: doc._id.toString(),
    konkName: doc.konkName,
    prodName: doc.prodName,
    title: doc.title,
    url: doc.url,
    isSliced: doc.isSliced,
    skus: doc.skus.map((id) => id.toString()),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
});
export const toSkugrWithoutSkusDto = (doc) => ({
    _id: doc._id.toString(),
    konkName: doc.konkName,
    prodName: doc.prodName,
    title: doc.title,
    url: doc.url,
    isSliced: doc.isSliced,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
});
