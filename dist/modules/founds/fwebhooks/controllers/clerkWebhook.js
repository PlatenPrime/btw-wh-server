import { Webhook } from "svix";
import Fuser from "../../fusers/models/Fuser.js";
export const clerkWebhook = async (req, res) => {
    console.log("Webhook received");
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) {
        throw new Error("WEBHOOK_SECRET is not defined in the environment variables.");
    }
    const payload = req.body;
    const headers = req.headers;
    const wh = new Webhook(WEBHOOK_SECRET);
    let evt;
    try {
        evt = wh.verify(payload, headers);
        console.log("EVT", evt);
    }
    catch (err) {
        res.status(400).json({
            message: "Webhook verification failed",
        });
    }
    if (evt.type === "user.created") {
        const newFuser = new Fuser({
            clerkUserId: evt.data.id,
            username: evt.data.username || evt.data.email_addresses[0].email_address,
            email: evt.data.email_addresses[0].email_address,
            fuserImg: evt.data.profile_image_url,
        });
        await newFuser.save();
        console.log("New Fuser created", newFuser);
    }
    if (evt.type === "user.updated") {
        const fuser = await Fuser.findOne({ clerkUserId: evt.data.id });
        if (fuser) {
            fuser.username =
                evt.data.username || evt.data.email_addresses[0].email_address;
            fuser.email = evt.data.email_addresses[0].email_address;
            fuser.fuserImg = evt.data.profile_image_url;
            await fuser.save();
            console.log("Fuser updated", fuser);
        }
    }
    if (evt.type === "user.deleted") {
        const fuser = await Fuser.findOneAndDelete({ clerkUserId: evt.data.id });
        if (fuser) {
            console.log("Fuser deleted", fuser);
        }
    }
    res.status(200).json({
        message: "Webhook received",
    });
};
