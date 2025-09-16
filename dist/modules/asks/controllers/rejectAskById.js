import { getCurrentFormattedDateTime } from "../../../utils/getCurrentFormattedDateTime.js";
import User from "../../auth/models/User.js";
import { Ask } from "../models/Ask.js";
export const rejectAskById = async (req, res) => {
    try {
        const { id } = req.params;
        const { solverId } = req.body;
        if (!solverId) {
            return res.status(400).json({ message: "solverId is required" });
        }
        const existingAsk = await Ask.findById(id);
        if (!existingAsk) {
            return res.status(404).json({ message: "Ask not found" });
        }
        const solver = await User.findById(solverId);
        if (!solver) {
            return res.status(404).json({ message: "Solver user not found" });
        }
        const solverData = {
            _id: solver._id,
            fullname: solver.fullname,
            telegram: solver.telegram,
            photo: solver.photo,
        };
        const time = getCurrentFormattedDateTime();
        const solverName = solverData.fullname;
        const newAction = `${time} ${solverName}: ВІДХИЛИВ запит`;
        const updatedActions = [...existingAsk.actions, newAction];
        const updateFields = {
            actions: updatedActions,
            solverData,
            solver: solverId,
            status: "rejected",
        };
        const updatedAsk = await Ask.findByIdAndUpdate(id, updateFields, {
            new: true,
            runValidators: true,
        });
        if (!updatedAsk) {
            return res.status(500).json({ message: "Failed to update ask" });
        }
        res.status(200).json(updatedAsk);
    }
    catch (error) {
        console.error("Error rejecting ask:", error);
        res.status(500).json({ message: "Server error", error });
    }
};
