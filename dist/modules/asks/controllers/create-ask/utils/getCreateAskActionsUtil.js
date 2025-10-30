import { getCurrentFormattedDateTime } from "../../../../../utils/getCurrentFormattedDateTime.js";
export const getCreateAskActionsUtil = ({ askerData, nameukr, quant, com }) => {
    const time = getCurrentFormattedDateTime();
    return [
        `${time} ${askerData?.fullname ?? ""}: необхідно ${nameukr}
    ${quant !== undefined && ", кількість: "}${quant}
    ${com && ", коментарій: "}${com}`,
    ];
};
