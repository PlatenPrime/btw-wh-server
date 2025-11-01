import { IUser } from "../../../models/User.js";
import { generateAccessToken } from "../../../utils/generateAccessToken.js";
import { getUserWithoutPasswordUtil } from "../../../utils/getUserWithoutPasswordUtil.js";

type GetMeResponseInput = {
  user: IUser;
};

type GetMeResponse = {
  user: Omit<IUser, "password">;
  token: string;
};

/**
 * Формирует ответ для getMe с пользователем и токеном
 *
 * @param input - Объект пользователя
 * @returns Объект с пользователем (без пароля) и токеном
 *
 * @example
 * ```typescript
 * const response = getMeResponseUtil({ user });
 * ```
 */
export const getMeResponseUtil = ({
  user,
}: GetMeResponseInput): GetMeResponse => {
  const userWithoutPassword = getUserWithoutPasswordUtil(user);
  const token = generateAccessToken(user._id.toString(), user.role || "USER");

  return {
    user: userWithoutPassword,
    token,
  };
};

