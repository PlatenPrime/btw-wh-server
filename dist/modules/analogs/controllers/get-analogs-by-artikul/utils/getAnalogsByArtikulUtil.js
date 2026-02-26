import { Analog } from "../../../models/Analog.js";
export const getAnalogsByArtikulUtil = async (artikul) => {
    const analogs = await Analog.find({ artikul })
        .sort({ createdAt: -1 })
        .lean();
    return analogs;
};
