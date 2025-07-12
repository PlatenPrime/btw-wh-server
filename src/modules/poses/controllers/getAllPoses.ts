import { Request, Response } from "express";
import { Pos } from "../models/Pos.js";

export const getAllPoses = async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      limit = "10",
      palletId,
      rowId,
      artikul,
      sklad,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Строим фильтр
    const filter: any = {};
    if (palletId) filter.palletId = palletId;
    if (rowId) filter.rowId = rowId;
    if (artikul) filter.artikul = { $regex: artikul, $options: "i" };
    if (sklad) filter.sklad = { $regex: sklad, $options: "i" };

    const poses = await Pos.find(filter)
      .populate("palletId", "title sector")
      .populate("rowId", "title")
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

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
