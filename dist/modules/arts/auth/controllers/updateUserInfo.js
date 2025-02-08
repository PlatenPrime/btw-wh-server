import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { generateAccessToken } from "../utils/generateAccessToken.js";
export const updateUserInfo = async (req, res) => {
    try {
        const { userId } = req.params;
        const { password, ...updateData } = req.body;
        if (password) {
            updateData.password = bcrypt.hashSync(password, 7);
        }
        const user = await User.findByIdAndUpdate(userId, updateData, {
            new: true,
        });
        if (!user) {
            return res.status(404).json({ message: "Користувач не знайдений" });
        }
        const token = generateAccessToken(user._id.toString(), user.role);
        const { password: _, ...userWithoutPassword } = user.toObject();
        res.json({ user: userWithoutPassword, token });
    }
    catch (error) {
        res
            .status(400)
            .json({
            message: "Помилка оновлення інформації користувача",
            error,
        });
    }
};
