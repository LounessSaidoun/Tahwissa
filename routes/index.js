import express from "express";
import authRoute from "./authRoutes.js"
import userRoute from "./userRoutes.js"
import articleRoute from "./articlesRoutes.js";
import postRoute from "./postsRoutes.js"
const router = express.Router();

router.use("/auth",authRoute);
router.use("/users",userRoute);

router.use("/articles",articleRoute);
router.use('/posts',postRoute);

export default router;