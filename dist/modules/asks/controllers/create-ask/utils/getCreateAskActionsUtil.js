import { getCurrentFormattedDateTime } from "../../../../../utils/getCurrentFormattedDateTime.js";
export const getCreateAskActionsUtil = ({ askerData, data, }) => {
    const nameukr = data.nameukr ?? "";
    const quant = data.quant ?? 0;
    const com = data.com ?? "";
    const time = getCurrentFormattedDateTime();
    return [
        `${time} ${askerData?.fullname ?? ""}: необхідно ${nameukr}
    ${quant !== undefined && ", кількість: "}${quant}
    ${com && ", коментарій: "}${com}`,
    ];
};
