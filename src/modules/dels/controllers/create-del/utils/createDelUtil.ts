import { Del, IDel } from "../../../models/Del.js";

type CreateDelUtilInput = {
  title: string;
  artikuls: Record<string, number>;
};

export const createDelUtil = async (
  input: CreateDelUtilInput
): Promise<IDel> => {
  const del = await Del.create({
    title: input.title,
    artikuls: input.artikuls ?? {},
  });
  return del;
};
