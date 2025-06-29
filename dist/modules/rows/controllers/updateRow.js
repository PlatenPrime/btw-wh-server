import { Row } from "../models/Row.js";
export const updateRow = async (req, res) => {
    console.log("Updating row with ID:", req.params.id);
    console.log("Incoming body:", req.body);
    const row = await Row.findByIdAndUpdate(req.params.id, req.body, { new: true });
    console.log("Updated row:", row);
    if (!row)
        return res.status(404).json({ message: 'Row not found' });
    res.json(row);
};
