export const toSkugrDto = (doc) => ({
    _id: doc._id.toString(),
    konkName: doc.konkName,
    prodName: doc.prodName,
    title: doc.title,
    url: doc.url,
    skus: doc.skus.map((id) => id.toString()),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
});
