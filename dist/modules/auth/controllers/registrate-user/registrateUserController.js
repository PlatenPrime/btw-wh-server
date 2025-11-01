import mongoose from "mongoose";
import { registrateUserSchema } from "./schemas/registrateUserSchema.js";
import { checkUserExistsUtil } from "./utils/checkUserExistsUtil.js";
import { getUserRoleUtil } from "./utils/getUserRoleUtil.js";
import { createUserUtil } from "./utils/createUserUtil.js";
import { getUserWithoutPasswordUtil } from "../../utils/getUserWithoutPasswordUtil.js";
export const registrateUserController = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        if (!req.body) {
            res.status(400).json({ message: "Невалідне тіло запиту" });
            return;
        }
        const { username, password, role, fullname, telegram, photo } = req.body;
        // Валидация входных данных
        const parseResult = registrateUserSchema.safeParse({
            username,
            password,
            role,
            fullname,
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
        // Проверка существования пользователя
        const userExists = await checkUserExistsUtil(parseResult.data.username);
        if (userExists) {
            res.status(409).json({
                message: "Користувач з таким username вже існує",
            });
            return;
        }
        let createdUser = null;
        // Создание пользователя в транзакции
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
        // Формирование ответа (без пароля)
        const userWithoutPassword = getUserWithoutPasswordUtil(createdUser);
        res.status(201).json({ user: userWithoutPassword });
    }
    catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ message: "Помилка реєстрації", error });
        }
    }
    finally {
        await session.endSession();
    }
};
