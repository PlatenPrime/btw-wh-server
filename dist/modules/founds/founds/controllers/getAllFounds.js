import Found from "../models/Found.js";
export const getAllFounds = async (req, res) => {
    const founds = await Found.find();
    res.json(founds);
};
