import { Art } from "../../../models/Art.js";
export const upsertArtsUtil = async ({ arts }) => {
    const operations = arts.map((art) => ({
        updateOne: {
            filter: { artikul: art.artikul },
            update: {
                $set: {
                    zone: art.zone,
                    namerus: art.namerus,
                    nameukr: art.nameukr,
                    ...(art.limit !== undefined && art.limit !== null && { limit: art.limit }),
                    ...(art.marker !== undefined && art.marker !== null && { marker: art.marker }),
                },
            },
            upsert: true,
        },
    }));
    const result = await Art.bulkWrite(operations);
    return result;
};
