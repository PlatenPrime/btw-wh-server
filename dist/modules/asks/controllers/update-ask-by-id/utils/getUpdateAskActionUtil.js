import { getCurrentFormattedDateTime } from "../../../../../utils/getCurrentFormattedDateTime.js";
export const getUpdateAskActionUtil = ({ solver, action, }) => {
    const time = getCurrentFormattedDateTime();
    const solverName = solver.fullname;
    return `${time} ${solverName}: ${action}`;
};
