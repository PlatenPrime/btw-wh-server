import { Konk, IKonk } from "../../../models/Konk.js";

type CreateKonkUtilInput = {
  name: string;
  title: string;
  url: string;
  imageUrl: string;
};

export const createKonkUtil = async (
  input: CreateKonkUtilInput
): Promise<IKonk> => {
  const konk = await Konk.create({
    name: input.name,
    title: input.title,
    url: input.url,
    imageUrl: input.imageUrl,
  });
  return konk;
};
