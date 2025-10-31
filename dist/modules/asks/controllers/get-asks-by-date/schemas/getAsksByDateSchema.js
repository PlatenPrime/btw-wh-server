import { z } from "zod";
export const getAsksByDateSchema = z.object({
    date: z.string().refine((val) => {
        const date = new Date(val);
        return !isNaN(date.getTime());
    }, {
        message: "Invalid date format. Please provide a valid date string",
    }),
});
