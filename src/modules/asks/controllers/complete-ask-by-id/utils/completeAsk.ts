import { ObjectId } from "mongodb";
import { getCurrentFormattedDateTime } from "../../../../../utils/getCurrentFormattedDateTime.js";
import { IUser } from "../../../../auth/models/User.js";
import { Ask, IAsk } from "../../../models/Ask.js";

export async function completeAsk({
  solver,
  ask,
}: {
  solver: IUser;
  ask: IAsk;
}) {
  const solverObjectId: ObjectId =
    typeof solver._id === "string"
      ? new ObjectId(solver._id)
      : new ObjectId(solver._id.toString());
  const solverData = {
    _id: solverObjectId.toString(),
    fullname: solver.fullname,
    telegram: solver.telegram,
    photo: solver.photo,
  };

  const time = getCurrentFormattedDateTime();
  const solverName = solverData.fullname;
  const newAction = `${time} ${solverName}: ВИКОНАВ запит`;
  const updatedActions = [...ask.actions, newAction];
  const updateFields: Partial<IAsk> = {
    actions: updatedActions,
    solverData,
    solver: solverObjectId,
    status: "completed",
  };
  const updatedAsk = await Ask.findByIdAndUpdate(ask._id, updateFields, {
    new: true,
    runValidators: true,
  });
  return updatedAsk;
}
