import Found from "../models/Found.js";
export const deleteFoundById = async (req, res) => {
    const deletedFound = await Found.findByIdAndDelete(req.params.id);
    if (!deletedFound) {
        res.status(404).json("Found not found");
        return;
    }
    else {
        res.json("Found has been deleted");
    }
};
