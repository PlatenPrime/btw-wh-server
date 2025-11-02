import mongoose, { ClientSession } from "mongoose";
import { Types } from "mongoose";
import { Ask } from "../../../../asks/models/Ask.js";
import { getCurrentFormattedDateTime } from "../../../../../utils/getCurrentFormattedDateTime.js";

/**
 * Adds a pull action to ask's actions array
 *
 * @param askId - ID of the ask
 * @param solverName - Name of the solver
 * @param actualQuant - Quantity that was pulled
 * @param actualBoxes - Number of boxes that were pulled
 * @param palletTitle - Title of the pallet
 * @param session - MongoDB session for transaction
 */
export const addPullActionToAskUtil = async (
  askId: Types.ObjectId,
  solverName: string,
  actualQuant: number,
  actualBoxes: number,
  palletTitle: string,
  session: ClientSession
): Promise<void> => {
  const time = getCurrentFormattedDateTime();
  const actionMessage = `${time} ${solverName}: знято ${actualQuant} шт. (${actualBoxes} кор.) з паллети ${palletTitle}`;

  await Ask.findByIdAndUpdate(
    askId,
    { $push: { actions: actionMessage } },
    { session }
  );
};
