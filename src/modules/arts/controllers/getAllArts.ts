import { Request, Response } from "express";
import { Art, IArt } from "../models/Art.js";


interface GetArtsQuery {
  page?: string;
  limit?: string;
  search?: string;
}

export const getAllArts = async (req: Request<{}, {}, {}, GetArtsQuery>, res: Response) => {
  try {
    const { page = "1", limit = "10", search = "" } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;

    const searchQuery = search ? {
      $or: [
        { artikul: { $regex: search, $options: "i" } },
        { nameukr: { $regex: search, $options: "i" } },
        { namerus: { $regex: search, $options: "i" } }
      ]
    } : {};

    const arts: IArt[] = await Art.find(searchQuery)
      .sort({ artikul: 1 }) 
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    const total = await Art.countDocuments(searchQuery);

    res.status(200).json({
      data: arts,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
    });
  } catch (error) {
    console.error("Error fetching arts:", error);
    res.status(500).json({ message: "Server error" });
  }
};
