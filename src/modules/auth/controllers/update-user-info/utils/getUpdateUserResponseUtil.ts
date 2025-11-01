import { IUser } from "../../../models/User.js";
import { generateAccessToken } from "../../../utils/generateAccessToken.js";
import { getUserWithoutPasswordUtil } from "../../../utils/getUserWithoutPasswordUtil.js";

type GetUpdateUserResponseInput = {
  user: IUser;
};

type UpdateUserResponse = {
  user: Omit<IUser, "password">;
  token: string;
};

/**
 * Формирует ответ для обновления пользователя с токеном
 *
 * @param input - Объект обновленного пользователя
 * @returns Объект с пользователем (без пароля) и токеном
 *
 * @example
 * ```typescript
 * const response = getUpdateUserResponseUtil({ user });
 * ```
 */
export const getUpdateUserResponseUtil = ({
  user,
}: GetUpdateUserResponseInput): UpdateUserResponse => {
  const userWithoutPassword = getUserWithoutPasswordUtil(user);
  const token = generateAccessToken(user._id.toString(), user.role || "USER");

  return {
    user: userWithoutPassword,
    token,
  };
};

