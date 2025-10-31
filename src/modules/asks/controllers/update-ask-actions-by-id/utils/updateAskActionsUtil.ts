import mongoose, { ClientSession } from "mongoose";
import { IAsk } from "../../../models/Ask.js";
import { Ask } from "../../../models/Ask.js";
import { IUser } from "../../../../auth/models/User.js";
import { getUpdateAskActionUtil } from "./getUpdateAskActionUtil.js";

interface UpdateAskActionsUtilInput {
  user: IUser;
  ask: IAsk;
  action: string;
  session: ClientSession;
}

export async function updateAskActionsUtil({
  user,
  ask,
  action,
  session,
}: UpdateAskActionsUtilInput): Promise<IAsk> {
  const newAction = getUpdateAskActionUtil({ user, action });
  const updatedActions = [...ask.actions, newAction];

  const updateFields: Partial<IAsk> = {
    actions: updatedActions,
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
    throw new Error("Failed to update ask actions");
  }

  return updatedAsk as IAsk;
}

