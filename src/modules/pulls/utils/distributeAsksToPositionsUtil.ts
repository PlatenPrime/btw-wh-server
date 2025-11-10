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
  if (positions.length === 0 || asks.length === 0) {
    return [];
  }

  const pullPositions: IPullPosition[] = [];
  const sortedPositions = sortPositionsBySector(positions);

  const quantifyDemand = (ask: IAsk): number | null => {
    if (typeof ask.quant !== "number" || ask.quant <= 0) {
      return null;
    }

    const currentPull = typeof ask.pullQuant === "number" ? ask.pullQuant : 0;
    const remaining = ask.quant - currentPull;

    return remaining > 0 ? remaining : null;
  };

  const quantifiedAsks = asks
    .map((ask) => {
      const demand = quantifyDemand(ask);
      return demand ? { ask, demand } : null;
    })
    .filter((entry): entry is { ask: IAsk; demand: number } => Boolean(entry));

  let positionIndex = 0;

  for (const { ask, demand } of quantifiedAsks) {
    let remainingDemand = demand;

    while (remainingDemand > 0 && positionIndex < sortedPositions.length) {
      const position = sortedPositions[positionIndex];
      const availableQuant = Math.max(position.quant, 0);

      if (availableQuant > 0) {
        const plannedQuant = Math.min(remainingDemand, availableQuant);
        pullPositions.push(
          createPullPositionUtil({
            position,
            ask,
            plannedQuant,
          })
        );
        remainingDemand -= plannedQuant;
      }

      positionIndex++;
    }

    positionIndex = 0;
  }

  const asksWithoutQuant = asks.filter(
    (ask) => typeof ask.quant !== "number" || ask.quant <= 0
  );

  if (asksWithoutQuant.length > 0 && sortedPositions.length > 0) {
    const firstPosition = sortedPositions[0];
    for (const ask of asksWithoutQuant) {
      pullPositions.push(
        createPullPositionUtil({
          position: firstPosition,
          ask,
          plannedQuant: null,
        })
      );
    }
  }

  return pullPositions;
};
