export const formatZonesForExcelUtil = (zones) => {
    return zones.map((zone) => ({
        "Название зоны": zone.title,
        Штрихкод: zone.bar,
        Сектор: zone.sector,
        "Дата создания": zone.createdAt.toLocaleDateString("ru-RU"),
        "Дата обновления": zone.updatedAt.toLocaleDateString("ru-RU"),
    }));
};
