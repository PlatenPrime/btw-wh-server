/**
 * Перечисляет календарные дни UTC от from до to включительно.
 */
export function enumerateSliceDates(from, to) {
    const out = [];
    const cursor = new Date(from);
    while (cursor.getTime() <= to.getTime()) {
        out.push(new Date(cursor));
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return out;
}
