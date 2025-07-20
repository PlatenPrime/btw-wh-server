import { Request, Response } from "express";
import { Pos } from "../models/Pos.js";

export const getAllPoses = async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      limit = "20",
      rowId,
      palletId,
      rowTitle,
      palletTitle,
      artikul,
      nameukr,
      sklad,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Строим фильтр
    const filter: any = {};
    if (palletId) filter["palletData._id"] = palletId;
    if (rowId) filter["rowData._id"] = rowId;
    if (rowTitle) filter["rowData.title"] = rowTitle;
    if (palletTitle) filter["palletData.title"] = palletTitle;
    if (artikul) filter.artikul = { $regex: artikul, $options: "i" };
    if (nameukr) filter.nameukr = { $regex: nameukr, $options: "i"}
    if (sklad) filter.sklad = { $regex: sklad, $options: "i" };

    const poses = await Pos.find(filter)
      .skip(skip)
      .limit(limitNum)
      .sort({ artikul: 1 });

    const total = await Pos.countDocuments(filter);

    res.json({
      data: poses,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch poses", details: error });
  }
};
