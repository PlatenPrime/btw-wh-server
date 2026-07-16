import { Event } from "../../../models/Event.js";
export const getEventByIdUtil = async (id) => {
    const event = await Event.findById(id).lean();
    return event;
};
