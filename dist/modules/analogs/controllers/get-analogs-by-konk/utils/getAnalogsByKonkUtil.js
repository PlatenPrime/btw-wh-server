import { Analog } from "../../../models/Analog.js";
export const getAnalogsByKonkUtil = async (konkName) => {
    const analogs = await Analog.find({ konkName })
        .sort({ createdAt: -1 })
        .lean();
    return analogs;
};
