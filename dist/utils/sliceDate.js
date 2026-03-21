/**
 * Нормализует дату до начала дня по UTC (срезы по календарным датам).
 */
export function toSliceDate(d) {
    const copy = new Date(d);
    copy.setUTCHours(0, 0, 0, 0);
    return copy;
}
