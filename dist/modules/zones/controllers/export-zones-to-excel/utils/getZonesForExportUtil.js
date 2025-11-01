import { Zone } from "../../../models/Zone.js";
export const getZonesForExportUtil = async () => {
    const zones = await Zone.find().sort({ sector: 1, title: 1 });
    return zones;
};
