import fs from "fs/promises";
import path from "path";
import { createLogger } from "../../logging/createLogger.js";
import { Art } from "../../modules/arts/models/Art.js";
import { Row } from "../../modules/rows/models/Row.js";
import { Pallet } from "../../modules/pallets/models/Pallet.js";
import { Pos } from "../../modules/poses/models/Pos.js";
import { Zone } from "../../modules/zones/models/Zone.js";
import { Block } from "../../modules/blocks/models/Block.js";
import { Seg } from "../../modules/segs/models/Seg.js";
import User from "../../modules/auth/models/User.js";
import Role from "../../modules/auth/models/Role.js";
const log = createLogger({ module: "backup" });
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
                log.error({ err, collection: "arts" }, "backup export collection failed");
                backupData.arts = [];
            }),
            Row.find().lean().exec().then(data => {
                backupData.rows = data;
            }).catch(err => {
                log.error({ err, collection: "rows" }, "backup export collection failed");
                backupData.rows = [];
            }),
            Pallet.find().lean().exec().then(data => {
                backupData.pallets = data;
            }).catch(err => {
                log.error({ err, collection: "pallets" }, "backup export collection failed");
                backupData.pallets = [];
            }),
            Pos.find().lean().exec().then(data => {
                backupData.poses = data;
            }).catch(err => {
                log.error({ err, collection: "poses" }, "backup export collection failed");
                backupData.poses = [];
            }),
            Zone.find().lean().exec().then(data => {
                backupData.zones = data;
            }).catch(err => {
                log.error({ err, collection: "zones" }, "backup export collection failed");
                backupData.zones = [];
            }),
            Block.find().lean().exec().then(data => {
                backupData.blocks = data;
            }).catch(err => {
                log.error({ err, collection: "blocks" }, "backup export collection failed");
                backupData.blocks = [];
            }),
            Seg.find().lean().exec().then(data => {
                backupData.segs = data;
            }).catch(err => {
                log.error({ err, collection: "segs" }, "backup export collection failed");
                backupData.segs = [];
            }),
            User.find().lean().exec().then(data => {
                backupData.users = data;
            }).catch(err => {
                log.error({ err, collection: "users" }, "backup export collection failed");
                backupData.users = [];
            }),
            Role.find().lean().exec().then(data => {
                backupData.roles = data;
            }).catch(err => {
                log.error({ err, collection: "roles" }, "backup export collection failed");
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
        log.info({ filePath }, "collections exported");
        return filePath;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        log.error({ err: error }, "backup export fatal error");
        throw new Error(`Failed to export collections: ${errorMessage}`);
    }
};
