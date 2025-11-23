import { IZone } from "../../../models/Zone.js";
import { ExcelZoneRow } from "./types.js";

export const formatZonesForExcelUtil = (zones: IZone[]): ExcelZoneRow[] => {
  return zones.map((zone) => ({
    "Назва": zone.title,
    Штрихкод: zone.bar,
    Сектор: zone.sector,
  }));
};
