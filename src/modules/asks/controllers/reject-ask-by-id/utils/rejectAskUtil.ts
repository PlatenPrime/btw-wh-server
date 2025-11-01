import mongoose, { ClientSession } from "mongoose";
import { Types } from "mongoose";
import { IUser } from "../../../../auth/models/User.js";
import { Ask, IAsk } from "../../../models/Ask.js";
import { getRejectAskActionUtil } from "./getRejectAskActionUtil.js";

interface RejectAskUtilInput {
  solver: IUser;
  solverId: Types.ObjectId;
  ask: IAsk;
  session: ClientSession;
}

export async function rejectAskUtil({
  solver,
  solverId,
  ask,
  session,
}: RejectAskUtilInput): Promise<IAsk> {
  const solverData = {
    _id: solver._id,
    fullname: solver.fullname,
    telegram: solver.telegram,
    photo: solver.photo,
  };

  const newAction = getRejectAskActionUtil({ solver });

  const updatedActions = [...ask.actions, newAction];
  const updateFields: Partial<IAsk> = {
    actions: updatedActions,
    solverData,
    solver: solverId,
    status: "rejected",
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
    throw new Error("Failed to update ask");
  }

  return updatedAsk as IAsk;
}

