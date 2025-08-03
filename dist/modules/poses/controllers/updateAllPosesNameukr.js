import { Pos } from "../models/Pos.js";
import { Art } from "../../arts/models/Art.js";
/**
 * Updates all Pos documents by adding nameukr field based on Art collection data
 * For each Pos document, finds corresponding Art document by artikul field
 * and copies nameukr value. If Art document is not found, sets nameukr to empty string.
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const updateAllPosesNameukr = async (req, res) => {
    try {
        console.log("Starting updateAllPosesNameukr process...");
        // Get all Pos documents
        const allPoses = await Pos.find({});
        console.log(`Found ${allPoses.length} Pos documents to update`);
        if (allPoses.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No Pos documents found to update",
                updatedCount: 0,
                skippedCount: 0,
                errors: []
            });
        }
        let count = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        const errors = [];
        // Process each Pos document
        for (const pos of allPoses) {
            count++;
            console.log(`Processing Pos document ${count} of ${allPoses.length}...`);
            console.log("Pos artikul:", pos.artikul);
            console.log("__________________________________________");
            try {
                // Find corresponding Art document by artikul
                const artDocument = await Art.findOne({ artikul: pos.artikul });
                // Set nameukr value based on Art document or empty string if not found
                const nameukrValue = artDocument?.nameukr || "";
                // Update the Pos document
                await Pos.updateOne({ _id: pos._id }, { $set: { nameukr: nameukrValue } });
                updatedCount++;
                if (updatedCount % 100 === 0) {
                    console.log(`Processed ${updatedCount} documents...`);
                }
            }
            catch (error) {
                console.error(`Error processing Pos document with artikul ${pos.artikul}:`, error);
                errors.push({
                    artikul: pos.artikul,
                    error: error instanceof Error ? error.message : "Unknown error"
                });
                skippedCount++;
            }
        }
        console.log(`Update process completed. Updated: ${updatedCount}, Skipped: ${skippedCount}`);
        return res.status(200).json({
            success: true,
            message: "Successfully updated Pos documents with nameukr field",
            updatedCount,
            skippedCount,
            errors: errors.length > 0 ? errors : undefined
        });
    }
    catch (error) {
        console.error("Error in updateAllPosesNameukr:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during update process",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
