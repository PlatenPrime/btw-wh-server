import { Request, Response } from "express";
import { Ask, IAsk } from "../models/Ask.js";

export const deleteAskById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ message: "ID is required" });
    return;
  }

  try {
    // Проверяем существование заявки перед удалением
    const ask: IAsk | null = await Ask.findById(id);

    if (!ask) {
      res.status(404).json({ message: "Ask not found" });
      return;
    }

    // Удаляем заявку
    await Ask.findByIdAndDelete(id);

    res.status(200).json({
      message: "Ask deleted successfully",
      data: { id, artikul: ask.artikul },
    });
  } catch (error) {
    console.error("Error deleting ask by ID:", error);
    res.status(500).json({
      message: "Server error while deleting ask",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
