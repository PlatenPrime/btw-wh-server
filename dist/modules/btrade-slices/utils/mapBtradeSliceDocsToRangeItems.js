/**
 * Преобразует документы Btrade-среза за период в массив точек для графиков.
 * Только те даты, по которым есть запись для artikul.
 */
export function mapBtradeSliceDocsToRangeItems(docs, artikulKey) {
    const data = [];
    for (const doc of docs) {
        const dataRecord = (doc.data ?? {});
        const item = dataRecord[artikulKey];
        if (!item)
            continue;
        data.push({
            date: doc.date.toISOString(),
            quantity: item.quantity,
            price: item.price,
        });
    }
    return data;
}
