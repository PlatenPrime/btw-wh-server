import Found from "../models/Found.js";
export const createFound = async (req, res) => {
    const newfound = new Found(req.body);
    const found = await newfound.save();
    res.json(found);
};
