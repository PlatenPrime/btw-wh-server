import express from "express";
const router = express.Router();
router.get("/anothertest", function (req, res) {
    res.status(200).send("User Route");
});
export default router;
