import { getUserByIdSchema } from "./schemas/getUserByIdSchema.js";
import { getUserByIdUtil } from "./utils/getUserByIdUtil.js";
export const getUserByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        // Валидация входных данных
        const parseResult = getUserByIdSchema.safeParse({ id });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        // Получение пользователя
        const user = await getUserByIdUtil(parseResult.data.id);
        if (!user) {
            res.status(404).json({ message: "Користувач не знайдений" });
            return;
        }
        res.status(200).json({ user });
    }
    catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ message: "Помилка при пошуку користувача", error });
        }
    }
};
