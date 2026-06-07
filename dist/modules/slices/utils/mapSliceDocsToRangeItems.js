/**
 * Преобразует документы среза за период в массив точек для графиков.
 * Только те даты, по которым есть запись для productKey.
 */
export function mapSliceDocsToRangeItems(docs, productKey) {
    const data = [];
    for (const doc of docs) {
        const dataRecord = (doc.data ?? {});
        const item = dataRecord[productKey];
        if (!item)
            continue;
        data.push({
            date: doc.date.toISOString(),
            stock: item.stock,
            price: item.price,
        });
    }
    return data;
}
