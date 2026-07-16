import { Event, IEvent } from "../../../models/Event.js";

export const getEventByIdUtil = async (
  id: string
): Promise<IEvent | null> => {
  const event = await Event.findById(id).lean();
  return event as IEvent | null;
};
