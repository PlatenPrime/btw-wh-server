import { Ask } from "../../../models/Ask.js";
import { buildAskEvent, mapUserToAskUserData, } from "../../../utils/askEventsUtil.js";
export const createAskUtil = async ({ artikul, nameukr, quant, com, sklad, askerData, actions, session, }) => {
    const mappedAskerData = mapUserToAskUserData(askerData);
    const createEvent = buildAskEvent({
        eventName: "create",
        user: mappedAskerData,
    });
    const ask = new Ask({
        artikul,
        nameukr,
        quant,
        com,
        sklad: sklad || "pogrebi",
        asker: mappedAskerData._id,
        askerData: mappedAskerData,
        actions,
        status: "new",
        events: [createEvent],
        pullQuant: 0,
        pullBox: 0,
    });
    await ask.save({ session });
    return ask;
};
