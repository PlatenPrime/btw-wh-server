import mongoose from "mongoose";
import { logModuleError, logModuleWarn, } from "../../../logging/logModuleError.js";
import User from "../../auth/models/User.js";
import { Event } from "../models/Event.js";
import { mapUserToEventUserData } from "./mapUserToEventUserData.js";
/**
 * Создаёт audit-событие. Fail-soft: при любой ошибке логирует и возвращает null,
 * чтобы не ломать основную бизнес-операцию.
 */
export const createEventUtil = async (input) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(input.userId)) {
            logModuleWarn("events", "Skip event: invalid userId", {
                userId: input.userId,
                department: input.department,
            });
            return null;
        }
        const department = input.department.trim();
        const description = input.description.trim();
        if (!department || !description) {
            logModuleWarn("events", "Skip event: empty department or description", {
                userId: input.userId,
                department: input.department,
            });
            return null;
        }
        const user = await User.findById(input.userId);
        if (!user) {
            logModuleWarn("events", "Skip event: user not found", {
                userId: input.userId,
                department,
            });
            return null;
        }
        const event = await Event.create({
            userId: user._id,
            userData: mapUserToEventUserData(user),
            department,
            description,
        });
        return event;
    }
    catch (error) {
        logModuleError("events", error, "Error creating event:");
        return null;
    }
};
