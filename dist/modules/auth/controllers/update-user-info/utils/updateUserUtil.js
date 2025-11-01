import User from "../../../models/User.js";
/**
 * Обновляет пользователя в транзакции
 *
 * @param input - ID пользователя, данные для обновления и сессия транзакции
 * @returns Обновленный пользователь или null если не найден
 *
 * @example
 * ```typescript
 * const user = await updateUserUtil({
 *   userId,
 *   updateData: { fullname: "New Name" },
 *   session
 * });
 * ```
 */
export const updateUserUtil = async ({ userId, updateData, session, }) => {
    const user = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        session,
    });
    return user;
};
