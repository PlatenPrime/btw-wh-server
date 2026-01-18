import fs from "fs/promises";
import path from "path";
import { Art } from "../../modules/arts/models/Art.js";
import { Row } from "../../modules/rows/models/Row.js";
import { Pallet } from "../../modules/pallets/models/Pallet.js";
import { Pos } from "../../modules/poses/models/Pos.js";
import { Zone } from "../../modules/zones/models/Zone.js";
import { Block } from "../../modules/blocks/models/Block.js";
import { Seg } from "../../modules/segs/models/Seg.js";
import User from "../../modules/auth/models/User.js";
import Role from "../../modules/auth/models/Role.js";
/**
 * Экспортирует все коллекции базы данных в JSON файл
 * @returns Путь к созданному файлу бэкапа
 * @throws Error если произошла ошибка при экспорте
 */
export const exportCollectionsToJson = async () => {
    try {
        const backupData = {
            arts: [],
            rows: [],
            pallets: [],
            poses: [],
            zones: [],
            blocks: [],
            segs: [],
            users: [],
            roles: [],
            exportDate: new Date().toISOString(),
        };
        // Экспортируем каждую коллекцию
        // Используем lean() для получения простых JS объектов без методов Mongoose
        // Используем catch для обработки ошибок отдельных коллекций
        const exportPromises = [
            Art.find().lean().exec().then(data => {
                backupData.arts = data;
            }).catch(err => {
                console.error("[BACKUP] Error exporting arts:", err);
                backupData.arts = [];
            }),
            Row.find().lean().exec().then(data => {
                backupData.rows = data;
            }).catch(err => {
                console.error("[BACKUP] Error exporting rows:", err);
                backupData.rows = [];
            }),
            Pallet.find().lean().exec().then(data => {
                backupData.pallets = data;
            }).catch(err => {
                console.error("[BACKUP] Error exporting pallets:", err);
                backupData.pallets = [];
            }),
            Pos.find().lean().exec().then(data => {
                backupData.poses = data;
            }).catch(err => {
                console.error("[BACKUP] Error exporting poses:", err);
                backupData.poses = [];
            }),
            Zone.find().lean().exec().then(data => {
                backupData.zones = data;
            }).catch(err => {
                console.error("[BACKUP] Error exporting zones:", err);
                backupData.zones = [];
            }),
            Block.find().lean().exec().then(data => {
                backupData.blocks = data;
            }).catch(err => {
                console.error("[BACKUP] Error exporting blocks:", err);
                backupData.blocks = [];
            }),
            Seg.find().lean().exec().then(data => {
                backupData.segs = data;
            }).catch(err => {
                console.error("[BACKUP] Error exporting segs:", err);
                backupData.segs = [];
            }),
            User.find().lean().exec().then(data => {
                backupData.users = data;
            }).catch(err => {
                console.error("[BACKUP] Error exporting users:", err);
                backupData.users = [];
            }),
            Role.find().lean().exec().then(data => {
                backupData.roles = data;
            }).catch(err => {
                console.error("[BACKUP] Error exporting roles:", err);
                backupData.roles = [];
            }),
        ];
        // Ждем завершения всех экспортов
        await Promise.all(exportPromises);
        // Создаем директорию для бэкапов если не существует
        const backupsDir = path.join(process.cwd(), "backups");
        try {
            await fs.access(backupsDir);
        }
        catch {
            await fs.mkdir(backupsDir, { recursive: true });
        }
        // Формируем имя файла с датой
        const date = new Date();
        const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
        const fileName = `collections_backup_${dateStr}.json`;
        const filePath = path.join(backupsDir, fileName);
        // Сохраняем JSON файл
        await fs.writeFile(filePath, JSON.stringify(backupData, null, 2), "utf-8");
        console.log(`[BACKUP] Collections exported to ${filePath}`);
        return filePath;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        console.error("[BACKUP] Fatal error during export:", errorMessage);
        throw new Error(`Failed to export collections: ${errorMessage}`);
    }
};
