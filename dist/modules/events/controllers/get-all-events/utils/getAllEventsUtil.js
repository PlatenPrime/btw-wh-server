import { Event } from "../../../models/Event.js";
export const getAllEventsUtil = async ({ page, limit, department, userId, from, to, }) => {
    const filter = {};
    if (department) {
        filter.department = department;
    }
    if (userId) {
        filter.userId = userId;
    }
    if (from || to) {
        filter.createdAt = {};
        if (from) {
            filter.createdAt.$gte = new Date(from);
        }
        if (to) {
            filter.createdAt.$lte = new Date(to);
        }
    }
    const [events, total] = await Promise.all([
        Event.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Event.countDocuments(filter),
    ]);
    const totalPages = Math.ceil(total / limit) || 0;
    return {
        events: events,
        pagination: {
            page,
            limit,
            total,
            totalPages,
        },
    };
};
