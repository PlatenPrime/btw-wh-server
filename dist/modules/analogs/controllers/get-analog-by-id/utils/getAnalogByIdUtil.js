import { Konk } from "../../../../konks/models/Konk.js";
import { Prod } from "../../../../prods/models/Prod.js";
import { Analog } from "../../../models/Analog.js";
export const getAnalogByIdUtil = async (id) => {
    const analog = await Analog.findById(id).lean();
    if (!analog)
        return null;
    const emptyRef = {
        id: "",
        name: "",
        title: "",
        imageUrl: "",
    };
    const [konkDoc, prodDoc] = await Promise.all([
        Konk.findOne({ name: analog.konkName }).lean(),
        Prod.findOne({ name: analog.prodName }).lean(),
    ]);
    const konk = konkDoc
        ? {
            id: String(konkDoc._id),
            name: konkDoc.name,
            title: konkDoc.title,
            imageUrl: konkDoc.imageUrl,
        }
        : { ...emptyRef };
    const prod = prodDoc
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
    };
};
