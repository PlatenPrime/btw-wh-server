import { Art } from "../../../../arts/models/Art.js";
import { Analog, IAnalog } from "../../../models/Analog.js";
import type { CreateAnalogInputOptional } from "../schemas/createAnalogSchema.js";

export const createAnalogUtil = async (
  input: CreateAnalogInputOptional
): Promise<IAnalog> => {
  let nameukr: string | undefined;
  const artikul = input.artikul ?? "";
  const hasArtikul = Boolean(artikul && artikul.trim() !== "");

  if (hasArtikul) {
    const art = await Art.findOne({ artikul }).lean();
    nameukr = art?.nameukr ?? undefined;
  }

  const analog = await Analog.create({
    konkName: input.konkName,
    prodName: input.prodName,
    url: input.url,
    artikul,
    nameukr,
    title: input.title,
    imageUrl: input.imageUrl,
  });
  return analog;
};
