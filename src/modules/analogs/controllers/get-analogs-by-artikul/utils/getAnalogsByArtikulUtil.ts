import { Analog } from "../../../models/Analog.js";

export const getAnalogsByArtikulUtil = async (artikul: string) => {
  const analogs = await Analog.find({ artikul })
    .sort({ artikul: 1 })
    .lean();
  return analogs;
};
