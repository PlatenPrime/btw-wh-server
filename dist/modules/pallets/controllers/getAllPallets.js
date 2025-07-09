import { Pallet } from "../models/Pallet.js";
export const getAllPallets = async (req, res) => {
    try {
        const pallets = await Pallet.find();
        res.json(pallets);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch pallets", details: error });
    }
};
