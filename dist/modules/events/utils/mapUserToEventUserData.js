import { normalizeObjectId } from "../../../utils/normalizeObjectId.js";
export const mapUserToEventUserData = (user) => {
    return {
        _id: normalizeObjectId(user._id),
        fullname: user.fullname,
        telegram: user.telegram,
        photo: user.photo,
    };
};
