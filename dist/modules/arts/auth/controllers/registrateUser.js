import bcrypt from "bcryptjs";
import Role from "../models/Role.js";
import User from "../models/User.js";
export const registration = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({ message: "Невалідне тіло запиту" });
        }
        const { username, password, role, fullname, telegram, photo } = req.body;
        const candidate = await User.findOne({ username });
        if (candidate)
            return res
                .status(409)
                .json({ message: "Користувач з таким username вже існує" });
        const hashPassword = bcrypt.hashSync(password, 7);
        const userRole = await Role.findOne({ value: role });
        const user = new User({
            username,
            password: hashPassword,
            role: userRole?.value || "USER",
            fullname,
            telegram,
            photo,
        });
        await user.save();
        const { password: _, ...userWithoutPassword } = user.toObject();
        return res.status(201).json({ user: userWithoutPassword });
    }
    catch (error) {
        res.status(500).json({ message: "Помилка реєстрації", error });
    }
};
