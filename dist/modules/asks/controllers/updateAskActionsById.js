import { getCurrentFormattedDateTime } from "../../../utils/getCurrentFormattedDateTime.js";
import User from "../../auth/models/User.js";
import { Ask } from "../models/Ask.js";
export const updateAskActionsById = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, userId } = req.body;
        if (!action) {
            return res.status(400).json({ message: "action is required" });
        }
        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }
        const existingAsk = await Ask.findById(id);
        if (!existingAsk) {
            return res.status(404).json({ message: "Ask not found" });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const time = getCurrentFormattedDateTime();
        const userName = user.fullname;
        const newAction = `${time} ${userName}: ${action}`;
        const updatedActions = [...existingAsk.actions, newAction];
        const updateFields = {
            actions: updatedActions,
        };
        const updatedAsk = await Ask.findByIdAndUpdate(id, updateFields, {
            new: true,
            runValidators: true,
        });
        if (!updatedAsk) {
            return res.status(500).json({ message: "Failed to update ask actions" });
        }
        res.status(200).json(updatedAsk);
    }
    catch (error) {
        console.error("Error updating ask actions:", error);
        res.status(500).json({ message: "Server error", error });
    }
};
