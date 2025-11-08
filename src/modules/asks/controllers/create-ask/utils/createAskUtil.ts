import { ClientSession } from "mongoose";
import { IUser } from "../../../../auth/models/User.js";
import { Ask, IAsk } from "../../../models/Ask.js";
import {
  buildAskEvent,
  mapUserToAskUserData,
} from "../../../utils/askEventsUtil.js";

type CreateAskInput = {
  artikul: string;
  nameukr?: string;
  quant?: number;
  com?: string;
  askerData: IUser;
  actions: string[];
  session: ClientSession;
};

export const createAskUtil = async ({
  artikul,
  nameukr,
  quant,
  com,
  askerData,
  actions,
  session,
}: CreateAskInput): Promise<IAsk> => {
  const mappedAskerData = mapUserToAskUserData(askerData);
  const createEvent = buildAskEvent({
    eventName: "create",
    user: mappedAskerData,
  });
  const ask: IAsk = new Ask({
    artikul,
    nameukr,
    quant,
    com,
    asker: mappedAskerData._id,
    askerData: mappedAskerData,
    actions,
    status: "new",
    events: [createEvent],
    pullQuant: 0,
    pullBox: 0,
  });

  await ask.save({ session });
  return ask as IAsk;
};
