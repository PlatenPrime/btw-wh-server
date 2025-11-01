import { loginUserSchema } from "./schemas/loginUserSchema.js";
import { validateUserCredentialsUtil } from "./utils/validateUserCredentialsUtil.js";
import { getLoginResponseUtil } from "./utils/getLoginResponseUtil.js";
export const loginUserController = async (req, res) => {
    try {
        if (!req.body) {
            res.status(400).json({ message: "Invalid request body" });
            return;
        }
        const { username, password } = req.body;
        // Валидация входных данных
        const parseResult = loginUserSchema.safeParse({ username, password });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        // Проверка учетных данных
        const { user, isValid } = await validateUserCredentialsUtil({
            username: parseResult.data.username,
            password: parseResult.data.password,
        });
        if (!user) {
            res.status(400).json({
                message: `Користувач ${parseResult.data.username} не знайдений`,
            });
            return;
        }
        if (!isValid) {
            res.status(400).json({ message: `Пароль не вірний` });
            return;
        }
        // Формирование ответа
        const response = getLoginResponseUtil({ user });
        res.status(200).json(response);
    }
    catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ message: "Login error", error });
        }
    }
};
