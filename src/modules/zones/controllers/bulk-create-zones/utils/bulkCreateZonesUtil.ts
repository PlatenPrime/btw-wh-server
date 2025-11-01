import { Zone } from "../../../models/Zone.js";
import { BulkCreateZonesInput } from "../schemas/bulkCreateZonesSchema.js";

type BulkCreateZonesUtilInput = {
  zones: BulkCreateZonesInput["zones"];
};

export const bulkCreateZonesUtil = async ({
  zones,
}: BulkCreateZonesUtilInput) => {
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

