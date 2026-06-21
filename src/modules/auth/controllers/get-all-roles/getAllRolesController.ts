import { Request, Response } from "express";
import { getAllRolesUtil } from "./utils/getAllRolesUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";

export const getAllRolesController = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const roles = await getAllRolesUtil();
    res.status(200).json(roles);
  } catch (error) {
    if (!res.headersSent) {
      logModuleError("auth", error, "operation failed");
      res.status(500).json({ message: "Error fetching roles", error });
    }
  }
};

