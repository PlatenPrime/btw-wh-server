import { IAsk } from "../../asks/models/Ask.js";
import { IPos } from "../../poses/models/Pos.js";
import { IPullPosition } from "../models/Pull.js";
import { sortPositionsBySector } from "./sortPositionsBySector.js";
import { createPullPositionUtil } from "./createPullPositionUtil.js";

/**
 * Distributes asks to available positions using greedy algorithm
 * Handles asks with specific quantity and asks with null quantity
 *
 * @param asks - Array of asks for the artikul
 * @param positions - Available positions for the artikul
 * @returns IPullPosition[] - Array of pull positions
 */
export const distributeAsksToPositionsUtil = (
  asks: IAsk[],
  positions: IPos[]
): IPullPosition[] => {
  if (positions.length === 0) {
    return [];
  }

  const pullPositions: IPullPosition[] = [];

  // Sort positions by sector (ASC)
  const sortedPositions = sortPositionsBySector(positions);

  // Split asks into two groups: with specific quantity and with null quantity
  const asksWithQuant = asks.filter((ask) => ask.quant && ask.quant > 0);
  const asksWithNullQuant = asks.filter(
    (ask) => !ask.quant || ask.quant <= 0
  );

  // Process asks with specific quantity using greedy algorithm
  let positionIndex = 0;

  for (const ask of asksWithQuant) {
    const requestedQuant = ask.quant!;
    let remainingQuant = requestedQuant;

    // Try to fulfill the ask from available positions
    while (remainingQuant > 0 && positionIndex < sortedPositions.length) {
      const position = sortedPositions[positionIndex];
      const availableQuant = position.quant;

      if (availableQuant > 0) {
        const quantToTake = Math.min(remainingQuant, availableQuant);

        const pullPosition = createPullPositionUtil(
          position,
          ask,
          quantToTake
        );

        pullPositions.push(pullPosition);
        remainingQuant -= quantToTake;
      }

      positionIndex++;
    }

    // Note: If remainingQuant > 0 here, the ask cannot be fully fulfilled
    // This is acceptable - the pull will show partial fulfillment
    // Reset position index for next ask
    positionIndex = 0;
  }

  // Process asks with null quantity - use first position (minimum sector)
  if (asksWithNullQuant.length > 0 && sortedPositions.length > 0) {
    const firstPosition = sortedPositions[0];

    // Create pull position for each null-quant ask
    for (const ask of asksWithNullQuant) {
      const pullPosition = createPullPositionUtil(firstPosition, ask, 0);
      pullPositions.push(pullPosition);
    }
  }

  return pullPositions;
};
