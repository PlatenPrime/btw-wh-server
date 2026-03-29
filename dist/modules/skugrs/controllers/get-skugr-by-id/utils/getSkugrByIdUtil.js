import { toSkugrWithoutSkusDto } from "../../../utils/toSkugrDto.js";
import { Skugr } from "../../../models/Skugr.js";
export const getSkugrByIdUtil = async (id) => {
    const skugr = await Skugr.findById(id).exec();
    if (!skugr) {
        return null;
    }
    return toSkugrWithoutSkusDto(skugr);
};
