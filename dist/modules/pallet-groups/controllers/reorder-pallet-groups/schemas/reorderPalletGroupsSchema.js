import mongoose from "mongoose";
import { z } from "zod";
const orderItemSchema = z.object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid pallet group ID format",
    }),
    order: z.number().int().min(1, "Order must be at least 1"),
});
export const reorderPalletGroupsSchema = z
    .object({
    orders: z
        .array(orderItemSchema)
        .min(1, "At least one order item must be provided"),
})
    .refine((data) => {
    const ids = data.orders.map((o) => o.id);
    return new Set(ids).size === ids.length;
}, { message: "Duplicate group IDs are not allowed", path: ["orders"] })
    .refine((data) => {
    const orders = data.orders.map((o) => o.order);
    return new Set(orders).size === orders.length;
}, { message: "Duplicate order values are not allowed", path: ["orders"] });
