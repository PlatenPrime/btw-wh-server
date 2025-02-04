import Art from "../models/Art.js";
export const getAllArts = async (req, res) => {
    try {
        const arts = await Art.find(); // Типизируем результат как массив IArt
        res.status(200).json(arts);
    }
    catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
