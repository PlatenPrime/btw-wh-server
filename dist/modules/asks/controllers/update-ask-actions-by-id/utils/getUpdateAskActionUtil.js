import { getCurrentFormattedDateTime } from "../../../../../utils/getCurrentFormattedDateTime.js";
export const getUpdateAskActionUtil = ({ user, action, }) => {
    const time = getCurrentFormattedDateTime();
    const userName = user.fullname;
    return `${time} ${userName}: ${action}`;
};
