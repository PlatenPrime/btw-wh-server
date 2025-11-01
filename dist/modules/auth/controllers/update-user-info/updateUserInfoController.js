import mongoose from "mongoose";
import { updateUserInfoSchema } from "./schemas/updateUserInfoSchema.js";
import { hashPasswordIfProvidedUtil } from "./utils/hashPasswordIfProvidedUtil.js";
import { updateUserUtil } from "./utils/updateUserUtil.js";
import { getUpdateUserResponseUtil } from "./utils/getUpdateUserResponseUtil.js";
export const updateUserInfoController = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { userId } = req.params;
        const { password, ...restUpdateData } = req.body;
        // Валидация входных данных
        const parseResult = updateUserInfoSchema.safeParse({
            userId,
            password,
            ...restUpdateData,
        });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        // Формирование данных для обновления
        const updateData = hashPasswordIfProvidedUtil({
            password: parseResult.data.password,
            fullname: parseResult.data.fullname,
            role: parseResult.data.role,
            telegram: parseResult.data.telegram,
            photo: parseResult.data.photo,
        });
        let updatedUser = null;
        // Обновление пользователя в транзакции
        await session.withTransaction(async () => {
            updatedUser = await updateUserUtil({
                userId: parseResult.data.userId,
                updateData,
                session,
            });
        });
        if (!updatedUser) {
            res.status(404).json({ message: "Користувач не знайдений" });
            return;
        }
        // Формирование ответа
        const response = getUpdateUserResponseUtil({ user: updatedUser });
        res.status(200).json(response);
    }
    catch (error) {
        if (!res.headersSent) {
            res.status(500).json({
                message: "Помилка оновлення інформації користувача",
                error,
            });
        }
    }
    finally {
        await session.endSession();
    }
};
