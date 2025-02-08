import { Request, Response } from "express";
import Role, { IRole } from "../models/Role.js";

export const getAllRoles = async (_req: Request, res: Response) => {
    try {
      const roles: IRole[]   = await Role.find();
      res.json(roles);
    } catch (error) {
      console.log(error);
    }
  };