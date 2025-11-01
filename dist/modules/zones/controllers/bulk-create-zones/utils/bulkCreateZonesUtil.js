import { Zone } from "../../../models/Zone.js";
export const bulkCreateZonesUtil = async ({ zones, }) => {
    const operations = zones.map((zone) => ({
        updateOne: {
            filter: { bar: zone.bar },
            update: {
                $set: {
                    title: zone.title,
                    bar: zone.bar,
                    sector: zone.sector !== undefined ? zone.sector : 0,
                },
            },
            upsert: true,
        },
    }));
    const result = await Zone.bulkWrite(operations);
    return result;
};
