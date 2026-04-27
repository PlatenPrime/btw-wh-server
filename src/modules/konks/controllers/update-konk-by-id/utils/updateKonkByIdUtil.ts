import { Konk, IKonk } from "../../../models/Konk.js";

type UpdateKonkByIdUtilInput = {
  id: string;
  name?: string;
  title?: string;
  url?: string;
  imageUrl?: string;
  recountDays?: string[];
};

export const updateKonkByIdUtil = async (
  input: UpdateKonkByIdUtilInput
): Promise<IKonk | null> => {
  const update: Partial<
    Pick<IKonk, "name" | "title" | "url" | "imageUrl" | "recountDays">
  > = {};
  if (input.name !== undefined) update.name = input.name;
  if (input.title !== undefined) update.title = input.title;
  if (input.url !== undefined) update.url = input.url;
  if (input.imageUrl !== undefined) update.imageUrl = input.imageUrl;
  if (input.recountDays !== undefined) update.recountDays = input.recountDays;

  if (Object.keys(update).length === 0) {
    return Konk.findById(input.id);
  }

  const konk = await Konk.findByIdAndUpdate(
    input.id,
    update,
    { new: true, runValidators: true }
  );
  return konk;
};
