import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import User, { IUser } from "../models/User.js";
import { generateAccessToken } from "../utils/generateAccessToken.js";

export const login = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Invalid request body" });
    }

    const { username, password } = req.body;
    const user: IUser | null = await User.findOne({ username });
    if (!user)
      return res
        .status(400)
        .json({ message: `Користувач ${username} не знайдений` });
    if (!bcrypt.compareSync(password, user.password))
      return res.status(400).json({ message: `Пароль не вірний` });
    const token = generateAccessToken(user._id.toString(), user.role!);
    return res.json({ user, token });
  } catch (error) {
    res.status(400).json({ message: "Login error" });
  }
};
