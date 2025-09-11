import { Request, Response } from "express";
import { IPos, Pos } from "../models/Pos.js";
import {
  GetPosesByArtikulResponse,
  WarehouseData,
} from "../types/getPosesByArtikulResponse.js";
import { sortPosesByPalletTitle } from "../utils/sortPosesByPalletTitle.js";

/**
 * Get poses by artikul grouped by warehouse (sklad)
 * @param req - Express request object with artikul parameter
 * @param res - Express response object
 */
export const getPosesByArtikul = async (req: Request, res: Response) => {
  try {
    const { artikul } = req.params;

    if (!artikul) {
      return res.status(400).json({
        success: false,
        message: "Artikul parameter is required",
      });
    }

    // Find all poses with the specified artikul
    const poses = await Pos.find({ artikul }).exec();

    if (!poses || poses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No poses found with the specified artikul",
      });
    }

    // Group poses by warehouse (sklad)
    const pogrebiPoses: IPos[] = [];
    const merezhiPoses: IPos[] = [];
    const otherPoses: IPos[] = [];

    poses.forEach((pos) => {
      const sklad = pos.sklad?.toLowerCase();
      if (sklad === "pogrebi") {
        pogrebiPoses.push(pos);
      } else if (sklad === "merezhi") {
        merezhiPoses.push(pos);
      } else {
        otherPoses.push(pos);
      }
    });

    // Sort poses by palletData.title
    sortPosesByPalletTitle(pogrebiPoses);
    sortPosesByPalletTitle(merezhiPoses);
    sortPosesByPalletTitle(otherPoses);

    // Calculate quantities for each warehouse
    const calculateWarehouseData = (poses: IPos[]): WarehouseData => {
      const quant = poses.reduce(
        (sum: number, pos: IPos) => sum + pos.quant,
        0
      );
      const boxes = poses.reduce(
        (sum: number, pos: IPos) => sum + pos.boxes,
        0
      );
      return {
        poses,
        quant,
        boxes,
      };
    };

    const pogrebi = calculateWarehouseData(pogrebiPoses);
    const merezhi = calculateWarehouseData(merezhiPoses);

    // Calculate total quantities
    const totalQuant = poses.reduce(
      (sum: number, pos: IPos) => sum + pos.quant,
      0
    );
    const totalBoxes = poses.reduce(
      (sum: number, pos: IPos) => sum + pos.boxes,
      0
    );

    const response: GetPosesByArtikulResponse = {
      total: poses.length,
      pogrebi,
      merezhi,
      totalQuant,
      totalBoxes,
    };

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Error in getPosesByArtikul:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
