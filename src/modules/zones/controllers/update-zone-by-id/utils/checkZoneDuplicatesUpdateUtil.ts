import { IZone, Zone } from "../../../models/Zone.js";
import { UpdateZoneInput } from "../schemas/updateZoneByIdSchema.js";

type CheckZoneDuplicatesUpdateInput = {
  id: string;
  updateData: UpdateZoneInput;
};

export const checkZoneDuplicatesUpdateUtil = async ({
  id,
  updateData,
}: CheckZoneDuplicatesUpdateInput): Promise<IZone | null> => {
  const duplicateQuery: any = {
    _id: { $ne: id },
  };

  if (updateData.title) {
    duplicateQuery.title = updateData.title;
  }
  if (updateData.bar !== undefined) {
    duplicateQuery.bar = updateData.bar;
  }

  const duplicateZone = await Zone.findOne(duplicateQuery);

  return duplicateZone as IZone | null;
};


