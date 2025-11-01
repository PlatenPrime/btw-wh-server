import { IZone } from "../../../models/Zone.js";

type ExcelZoneRow = {
  "Название зоны": string;
  Штрихкод: number;
  Сектор: number;
  "Дата создания": string;
  "Дата обновления": string;
};

export const formatZonesForExcelUtil = (
  zones: IZone[]
): ExcelZoneRow[] => {
  return zones.map((zone) => ({
    "Название зоны": zone.title,
    Штрихкод: zone.bar,
    Сектор: zone.sector,
    "Дата создания": zone.createdAt.toLocaleDateString("ru-RU"),
    "Дата обновления": zone.updatedAt.toLocaleDateString("ru-RU"),
  }));
};

