import { FilterQuery } from "mongoose";
import { IPos, Pos } from "../../../models/Pos.js";

type ExportablePos = Pick<IPos, "artikul" | "nameukr" | "quant" | "sklad">;

export const getPosesStocksForExportUtil = async (
  sklad?: string
): Promise<ExportablePos[]> => {
  const filter: FilterQuery<IPos> = {
    quant: { $gt: 0 },
  };

  if (sklad) {
    filter.sklad = sklad;
  }

  const poses = await Pos.find(filter)
    .select("artikul nameukr quant sklad")
    .lean<ExportablePos[]>();

  return poses;
};


