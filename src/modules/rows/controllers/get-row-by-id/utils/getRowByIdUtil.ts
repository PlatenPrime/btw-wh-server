import { Pallet } from "../../../../pallets/models/Pallet.js";
import type { PalletShortDto } from "../../../../pallets/types/PalletShortDto.js";
import { IRow, Row } from "../../../models/Row.js";

type RowWithPallets = {
  _id: any;
  title: string;
  pallets: Array<
    PalletShortDto & {
      _id: any;
    }
  >;
  createdAt?: Date;
  updatedAt?: Date;
};

export const getRowByIdUtil = async (
  id: string,
): Promise<RowWithPallets | null> => {
  const row: IRow | null = await Row.findById(id);

  if (!row) {
    return null;
  }

  const pallets = await Pallet.find({ "rowData._id": row._id }).select(
    "_id title sector poses isDef",
  );

  const palletsFormatted = pallets.map((p) => ({
    _id: p._id,
    id: p._id.toString(),
    title: p.title,
    sector: p.sector,
    isEmpty: p.poses.length === 0,
    isDef: p.isDef,
  }));

  // Сортируем паллеты по title с учетом числовых частей
  const sortedPallets = palletsFormatted.slice().sort((a, b) => {
    const partsA = a.title.split("-");
    const partsB = b.title.split("-");
    for (let i = 0; i < partsA.length; i++) {
      const numA = parseInt(partsA[i]);
      const numB = parseInt(partsB[i]);
      if (numA < numB) return -1;
      if (numA > numB) return 1;
    }
    return 0;
  });

  return {
    _id: row._id,
    title: row.title,
    pallets: sortedPallets,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};
