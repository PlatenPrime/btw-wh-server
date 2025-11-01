import { getAllRolesUtil } from "./utils/getAllRolesUtil.js";
export const getAllRolesController = async (_req, res) => {
    try {
        const roles = await getAllRolesUtil();
        res.status(200).json(roles);
    }
    catch (error) {
        if (!res.headersSent) {
            console.error(error);
            res.status(500).json({ message: "Error fetching roles", error });
        }
    }
};
