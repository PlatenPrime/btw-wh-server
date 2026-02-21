import { Prod, IProd } from "../../../models/Prod.js";

type CreateProdUtilInput = {
  name: string;
  title: string;
  imageUrl: string;
};

export const createProdUtil = async (
  input: CreateProdUtilInput
): Promise<IProd> => {
  const prod = await Prod.create({
    name: input.name,
    title: input.title,
    imageUrl: input.imageUrl,
  });
  return prod;
};
