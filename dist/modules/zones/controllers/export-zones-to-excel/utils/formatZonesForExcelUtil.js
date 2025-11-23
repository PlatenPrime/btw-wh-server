export const formatZonesForExcelUtil = (zones) => {
    return zones.map((zone) => ({
        "Назва": zone.title,
        Штрихкод: zone.bar,
        Сектор: zone.sector,
    }));
};
