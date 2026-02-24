import { Constant, IConstant } from "../../../models/Constant.js";

export const deleteConstantByIdUtil = async (
  id: string
): Promise<IConstant | null> => {
  const constant = await Constant.findByIdAndDelete(id);
  return constant;
};
