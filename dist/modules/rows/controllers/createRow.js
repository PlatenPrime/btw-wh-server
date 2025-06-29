import { Row } from "../models/Row.js";
export const createRow = async (req, res) => {
    const { title } = req.body;
    const row = new Row({ title });
    await row.save();
    res.status(201).json(row);
};
