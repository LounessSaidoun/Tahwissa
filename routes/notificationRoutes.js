import express from "express"
import userAuth from "../middleware/authmiddleware.js";
import { getNotifications, markAsRead } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/Notifications",userAuth,getNotifications);
router.patch('/mark-as-read',userAuth,markAsRead);

export default router;