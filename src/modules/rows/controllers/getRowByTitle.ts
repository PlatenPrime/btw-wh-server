import { Request, Response } from "express";
import { Pallet } from "../../pallets/models/Pallet.js";
import { sortPalletsByTitle } from "../../pallets/utils/sortPalletsByTitle.js";
import { IRow, Row } from "../models/Row.js";

export const getRowByTitle = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { title } = req.params;

  try {
    const row: IRow | null = await Row.findOne({ title: title });

    if (!row) {
      res.status(404).json({ message: "Row not found" });
      return;
    }

    const pallets = await Pallet.find({ "rowData._id": row._id }).select(
      "_id title sector poses isDef"
    );
    const palletsFormatted = pallets.map((p) => ({
      _id: p._id,
      title: p.title,
      sector: p.sector,
      isEmpty: p.poses.length === 0,
      isDef: p.isDef,
    }));

    const sortedPallets = sortPalletsByTitle(palletsFormatted);

    res.status(200).json({
      _id: row._id,
      title: row.title,
      pallets: sortedPallets,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  } catch (error) {
    console.log("Error fetching row:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
