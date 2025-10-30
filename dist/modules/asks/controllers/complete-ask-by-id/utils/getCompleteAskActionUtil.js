import { getCurrentFormattedDateTime } from "../../../../../utils/getCurrentFormattedDateTime.js";
export const getCompleteAskActionUtil = ({ solver, }) => {
    const time = getCurrentFormattedDateTime();
    const solverName = solver.fullname;
    return `${time} ${solverName}: ВИКОНАВ запит`;
};
