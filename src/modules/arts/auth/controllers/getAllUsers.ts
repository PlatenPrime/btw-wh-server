import { Request, Response } from "express";
import User, { IUser } from "../models/User.js";

export const getAllUsers = async (_req: Request, res: Response) => {
    try {
      const users: IUser[] = await User.find();
      res.json(users);
    } catch (error) {
      console.log(error);
    }
  };