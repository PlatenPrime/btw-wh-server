import mongoose from "mongoose";
import { IRow } from "../../../../rows/models/Row.js";

/**
 * Формирует rowData subdocument для позиции из объекта ряда
 */
export const getRowDataUtil = (row: IRow) => {
  return {
    _id: row._id as mongoose.Types.ObjectId,
    title: row.title,
  };
};

