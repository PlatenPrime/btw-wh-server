import { getCurrentFormattedDateTime } from "../../../../../utils/getCurrentFormattedDateTime.js";
export const getRejectAskActionUtil = ({ solver, }) => {
    const time = getCurrentFormattedDateTime();
    const solverName = solver.fullname;
    return `${time} ${solverName}: ВІДХИЛИВ запит`;
};
