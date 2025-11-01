import mongoose, { ClientSession } from "mongoose";
import { Types } from "mongoose";
import { AskStatus, IAsk } from "../../../models/Ask.js";
import { Ask } from "../../../models/Ask.js";
import { IUser } from "../../../../auth/models/User.js";
import { getUpdateAskActionUtil } from "./getUpdateAskActionUtil.js";

interface UpdateAskUtilInput {
  solver: IUser;
  solverId: Types.ObjectId;
  ask: IAsk;
  action: string;
  status?: AskStatus;
  session: ClientSession;
}

export async function updateAskUtil({
  solver,
  solverId,
  ask,
  action,
  status,
  session,
}: UpdateAskUtilInput): Promise<IAsk> {
  const solverData = {
    _id: solver._id,
    fullname: solver.fullname,
    telegram: solver.telegram,
    photo: solver.photo,
  };

  const newAction = getUpdateAskActionUtil({ solver, action });
  const updatedActions = [...ask.actions, newAction];

  const updateFields: Partial<IAsk> = {
    actions: updatedActions,
    solverData,
    solver: solverId,
  };

  if (status) {
    updateFields.status = status;
  }

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
    throw new Error("Failed to update ask");
  }

  return updatedAsk as IAsk;
}

