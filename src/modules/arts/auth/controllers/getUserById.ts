import { Request, Response } from "express";
import User, { IUser } from "../models/User.js";

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user: IUser = await User.findById(req.params.id).select("-password");
    if (!user)
      return res.status(500).json({ message: "Користувач не знайдений" });
    res.json({ user });
  } catch (error) {
    res.json({ message: "Помилка при пошуку користувача" });
  }
};
