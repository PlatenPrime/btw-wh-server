import Found from "../models/Found.js";
export const getFoundBySlug = async (req, res) => {
    const found = await Found.findOne({ slug: req.params.slug });
    res.json(found);
};
