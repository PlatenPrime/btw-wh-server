import { Request, Response } from "express";
import { generateAccessToken } from "../utils/generateAccessToken.js";
import User, { IUser } from "../models/User.js";


export const getMe = async (req: Request, res: Response) => {
    try {
      const user: IUser | null = await User.findById(req.params.id);
      if (!user) return res.status(400).json({ message: "Користувач не знайдений" });
      const token = generateAccessToken(user._id.toString(), user.role!);
      res.json({ user, token });
    } catch (error) {
      res.json({ message: "Немає доступу." });
    }
  };