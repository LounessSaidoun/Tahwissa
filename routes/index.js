import express from "express";
import authRoute from "./authRoutes.js"
import userRoute from "./userRoutes.js"
import friendRequestRoute from "./friendRequestRoutes.js"
import notifactionRoutes from "./notificationRoutes.js"
import postRoutes from "./postsRoutes.js"
import articleRoutes from "./articlesRoutes.js"

const router = express.Router();

router.use("/auth",authRoute);
router.use("/users",userRoute);
router.use("/friend-request",friendRequestRoute)
router.use("/notification",notifactionRoutes);
router.use("/post",postRoutes);
router.use("/article",articleRoutes)
export default router;