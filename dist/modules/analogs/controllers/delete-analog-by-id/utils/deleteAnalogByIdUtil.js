import { Analog } from "../../../models/Analog.js";
export const deleteAnalogByIdUtil = async (id) => {
    const analog = await Analog.findByIdAndDelete(id);
    return analog;
};
