import { Konk } from "../../../../konks/models/Konk.js";
import { Prod } from "../../../../prods/models/Prod.js";
import { Analog } from "../../../models/Analog.js";

export type KonkRef = { id: string; name: string; title: string; imageUrl: string };
export type ProdRef = { id: string; name: string; title: string; imageUrl: string };
export type EnrichedAnalog = Record<string, unknown> & {
  konk: KonkRef;
  prod: ProdRef;
};

export const getAnalogByIdUtil = async (
  id: string
): Promise<EnrichedAnalog | null> => {
  const analog = await Analog.findById(id).lean();
  if (!analog) return null;

  const emptyRef: KonkRef = {
    id: "",
    name: "",
    title: "",
    imageUrl: "",
  };

  const [konkDoc, prodDoc] = await Promise.all([
    Konk.findOne({ name: analog.konkName }).lean(),
    Prod.findOne({ name: analog.prodName }).lean(),
  ]);

  const konk: KonkRef = konkDoc
    ? {
        id: String(konkDoc._id),
        name: konkDoc.name,
        title: konkDoc.title,
        imageUrl: konkDoc.imageUrl,
      }
    : { ...emptyRef };

  const prod: ProdRef = prodDoc
    ? {
        id: String(prodDoc._id),
        name: prodDoc.name,
        title: prodDoc.title,
        imageUrl: prodDoc.imageUrl,
      }
    : { ...emptyRef };

  return {
    ...analog,
    konk,
    prod,
  } as EnrichedAnalog;
};
