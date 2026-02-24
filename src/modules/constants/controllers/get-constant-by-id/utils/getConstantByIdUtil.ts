import { Constant, IConstant } from "../../../models/Constant.js";

export const getConstantByIdUtil = async (
  id: string
): Promise<IConstant | null> => {
  const constant = await Constant.findById(id);
  return constant;
};
