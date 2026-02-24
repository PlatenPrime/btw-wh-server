import { Constant, IConstant } from "../../../models/Constant.js";

type CreateConstantUtilInput = {
  name: string;
  title: string;
  data: Record<string, string>;
};

export const createConstantUtil = async (
  input: CreateConstantUtilInput
): Promise<IConstant> => {
  const constant = await Constant.create({
    name: input.name,
    title: input.title,
    data: input.data ?? {},
  });
  return constant;
};
