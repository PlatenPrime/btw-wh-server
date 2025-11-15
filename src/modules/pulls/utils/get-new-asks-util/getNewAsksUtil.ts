import { Ask, IAsk } from "../../../asks/models/Ask.js";

/**
 * Gets all asks with "new" status
 *
 * @returns Promise<IAsk[]> - Array of new asks
 */

export const getNewAsksUtil = async (): Promise<IAsk[]> => {
  const newAsks = (await Ask.find({ status: "new" }).lean()) as IAsk[];

  if (newAsks.length === 0) {
    return [];
  }

  return newAsks;
};
