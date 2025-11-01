import { IZone, Zone } from "../../../models/Zone.js";
import { UpdateZoneInput } from "../schemas/updateZoneByIdSchema.js";

type UpdateZoneByIdUtilInput = {
  id: string;
  updateData: UpdateZoneInput;
};

export const updateZoneByIdUtil = async ({
  id,
  updateData,
}: UpdateZoneByIdUtilInput): Promise<IZone | null> => {
  const updatedZone: IZone | null = await Zone.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  return updatedZone;
};


