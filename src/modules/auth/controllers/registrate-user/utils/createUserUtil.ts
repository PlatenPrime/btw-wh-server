import mongoose, { ClientSession } from "mongoose";
import User, { IUser } from "../../../models/User.js";
import { hashPasswordUtil } from "../../../utils/hashPasswordUtil.js";

type CreateUserInput = {
  username: string;
  password: string;
  fullname: string;
  role: string;
  telegram?: string;
  photo?: string;
  session: ClientSession;
};

/**
 * Создает нового пользователя в транзакции
 *
 * @param input - Данные пользователя и сессия транзакции
 * @returns Созданный пользователь
 *
 * @example
 * ```typescript
 * const user = await createUserUtil({
 *   username: "testuser",
 *   password: "password123",
 *   fullname: "Test User",
 *   role: "USER",
 *   session
 * });
 * ```
 */
export const createUserUtil = async ({
  username,
  password,
  fullname,
  role,
  telegram,
  photo,
  session,
}: CreateUserInput): Promise<IUser> => {
  const hashPassword = hashPasswordUtil(password);

  const user = new User({
    username,
    password: hashPassword,
    role,
    fullname,
    telegram,
    photo,
  });

  await user.save({ session });
  return user as IUser;
};

