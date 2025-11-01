/**
 * Формирует rowData subdocument для позиции из объекта ряда
 */
export const getRowDataUtil = (row) => {
    return {
        _id: row._id,
        title: row.title,
    };
};
