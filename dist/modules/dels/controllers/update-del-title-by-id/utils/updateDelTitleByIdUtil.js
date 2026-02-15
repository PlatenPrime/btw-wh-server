import { Del } from "../../../models/Del.js";
export const updateDelTitleByIdUtil = async (input) => {
    const del = await Del.findByIdAndUpdate(input.id, { title: input.title }, { new: true, runValidators: true });
    return del;
};
