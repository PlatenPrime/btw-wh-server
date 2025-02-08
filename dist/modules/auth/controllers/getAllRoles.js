import Role from "../models/Role.js";
export const getAllRoles = async (_req, res) => {
    try {
        const roles = await Role.find();
        res.json(roles);
    }
    catch (error) {
        console.log(error);
    }
};
