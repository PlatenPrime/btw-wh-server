import { Analog, IAnalog } from "../../../models/Analog.js";

export const deleteAnalogByIdUtil = async (
  id: string
): Promise<IAnalog | null> => {
  const analog = await Analog.findByIdAndDelete(id);
  return analog;
};
