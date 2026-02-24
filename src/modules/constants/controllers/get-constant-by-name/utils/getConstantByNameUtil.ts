import { Constant, IConstant } from "../../../models/Constant.js";

export const getConstantByNameUtil = async (
  name: string
): Promise<IConstant | null> => {
  const constant = await Constant.findOne({ name });
  return constant;
};
