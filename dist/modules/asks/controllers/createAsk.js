import { Ask } from "../models/Ask.js";
export const createAsk = async (req, res) => {
    try {
        const { artikul, nameukr, quant, com, askerData } = req.body;
        const now = new Date();
        const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
        const formattedDateTime = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
        const actions = [
            `${formattedDateTime} ${askerData?.fullname ?? ""} необхідно ${nameukr} в кількості ${quant}, коментарій: ${com}`,
        ];
        const ask = new Ask({
            artikul,
            nameukr,
            quant,
            com,
            asker: askerData.id,
            askerData,
            actions,
            status: "new",
        });
        await ask.save();
        res.status(201).json(ask);
    }
    catch (error) {
        console.error("Error creating ask:", error);
        res.status(500).json({ message: "Server error", error });
    }
};
