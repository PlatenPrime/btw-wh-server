import { getAllUsersUtil } from "./utils/getAllUsersUtil.js";
export const getAllUsersController = async (_req, res) => {
    try {
        const users = await getAllUsersUtil();
        res.status(200).json(users);
    }
    catch (error) {
        if (!res.headersSent) {
            console.error(error);
            res.status(500).json({ message: "Error fetching users", error });
        }
    }
};
