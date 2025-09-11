import { IPos } from "../models/Pos.js";

/**
 * Warehouse data structure containing poses and calculated quantities
 */
export interface WarehouseData {
  poses: IPos[];
  quant: number;
  boxes: number;
}

/**
 * Response structure for getPosesByArtikul controller
 */
export interface GetPosesByArtikulResponse {
  total: number;
  pogrebi: WarehouseData;
  merezhi: WarehouseData;
  totalQuant: number;
  totalBoxes: number;
}
