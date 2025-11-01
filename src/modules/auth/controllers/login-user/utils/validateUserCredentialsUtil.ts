import User, { IUser } from "../../../models/User.js";
import { comparePasswordUtil } from "../../../utils/comparePasswordUtil.js";

type ValidateUserCredentialsInput = {
  username: string;
  password: string;
};

type ValidateUserCredentialsResult = {
  user: IUser | null;
  isValid: boolean;
};

/**
 * Проверяет учетные данные пользователя
 *
 * @param input - username и password
 * @returns Объект с пользователем и флагом валидности
 *
 * @example
 * ```typescript
 * const result = await validateUserCredentialsUtil({
 *   username: "testuser",
 *   password: "password123"
 * });
 * ```
 */
export const validateUserCredentialsUtil = async ({
  username,
  password,
}: ValidateUserCredentialsInput): Promise<ValidateUserCredentialsResult> => {
  const user = await User.findOne({ username });

  if (!user) {
    return { user: null, isValid: false };
  }

  const isValid = comparePasswordUtil(password, user.password);

  return { user, isValid };
};

