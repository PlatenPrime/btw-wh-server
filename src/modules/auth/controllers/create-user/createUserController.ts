import { Request, Response } from "express";
import mongoose from "mongoose";
import { createUserSchema } from "./schemas/createUserSchema.js";
import { checkUserExistsUtil } from "../registrate-user/utils/checkUserExistsUtil.js";
import { getUserRoleUtil } from "../registrate-user/utils/getUserRoleUtil.js";
import { createUserUtil } from "../registrate-user/utils/createUserUtil.js";
import { getUserWithoutPasswordUtil } from "../../utils/getUserWithoutPasswordUtil.js";

export const createUserController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const session = await mongoose.startSession();

  try {
    if (!req.body) {
      res.status(400).json({ message: "Невалідне тіло запиту" });
      return;
    }

    const { username, password, fullname, role, telegram, photo } = req.body;

    const parseResult = createUserSchema.safeParse({
      username,
      password,
      fullname,
      role,
      telegram,
      photo,
    });

    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const userExists = await checkUserExistsUtil(parseResult.data.username);
    if (userExists) {
      res.status(409).json({
        message: "Користувач з таким username вже існує",
      });
      return;
    }

    let createdUser: any = null;

    await session.withTransaction(async () => {
      const userRole = await getUserRoleUtil(parseResult.data.role);
      createdUser = await createUserUtil({
        username: parseResult.data.username,
        password: parseResult.data.password,
        fullname: parseResult.data.fullname,
        role: userRole,
        telegram: parseResult.data.telegram,
        photo: parseResult.data.photo,
        session,
      });
    });

    const userWithoutPassword = getUserWithoutPasswordUtil(createdUser);
    res.status(201).json({ user: userWithoutPassword });
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ message: "Помилка створення користувача", error });
    }
  } finally {
    await session.endSession();
  }
};
