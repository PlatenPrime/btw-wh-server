import mongoose, { ClientSession } from "mongoose";
import { Types } from "mongoose";
import { IUser } from "../../../../auth/models/User.js";
import { Ask, IAsk } from "../../../models/Ask.js";
import { getCompleteAskActionUtil } from "./getCompleteAskActionUtil.js";

interface CompleteAskUtilInput {
  solver: IUser;
  solverId: Types.ObjectId;
  ask: IAsk;
  session: ClientSession;
}

export async function completeAskUtil({
  solver,
  solverId,
  ask,
  session,
}: CompleteAskUtilInput): Promise<IAsk> {
  const solverData = {
    _id: String(solver._id),
    fullname: solver.fullname,
    telegram: solver.telegram,
    photo: solver.photo,
  };

  const newAction = getCompleteAskActionUtil({ solver });

  const updatedActions = [...ask.actions, newAction];
  const updateFields: Partial<IAsk> = {
    actions: updatedActions,
    solverData,
    solver: solverId,
    status: "completed",
  };

  const updatedAsk = await Ask.findByIdAndUpdate(
    ask._id,
    updateFields,
    {
      new: true,
      runValidators: true,
      session,
    }
  );

  if (!updatedAsk) {
    throw new Error("Failed to complete ask");
  }

  return updatedAsk as IAsk;
}
