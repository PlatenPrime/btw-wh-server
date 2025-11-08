import { normalizeObjectId } from "../../../utils/normalizeObjectId.js";
export const mapUserToAskUserData = (user) => {
    return {
        _id: normalizeObjectId(user._id),
        fullname: user.fullname,
        telegram: user.telegram,
        photo: user.photo,
    };
};
export const buildAskEvent = ({ eventName, user, pullDetails, }) => {
    if (eventName === "pull" && !pullDetails) {
        throw new Error("Pull events require pullDetails payload");
    }
    if (eventName !== "pull" && pullDetails) {
        throw new Error("Only pull events may contain pullDetails payload");
    }
    return {
        eventName,
        userData: mapUserToAskUserData(user),
        date: new Date(),
        pullDetails,
    };
};
