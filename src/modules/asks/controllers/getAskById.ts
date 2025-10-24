import { Request, Response } from "express";
import { Ask, IAsk } from "../models/Ask.js";

export const getAskById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ message: "ID is required" });
    return;
  }

  try {
    const ask: IAsk | null = await Ask.findById(id);

    if (!ask) {
      res.status(200).json({
        exists: false,
        message: "Ask not found",
        data: null,
      });
      return;
    }

    res.status(200).json({
      exists: true,
      message: "Ask retrieved successfully",
      data: ask,
    });
  } catch (error) {
    console.error("Error fetching ask by ID:", error);
    res.status(500).json({
      message: "Server error while fetching ask",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
