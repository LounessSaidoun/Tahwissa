import { verify } from "crypto";
import express from "express"
import path from "path"
import { changePassword, requestPasswordReset, resetPassword, verifyEmail, addIntrests, removeInterest} from "../controllers/userController.js";
import { resetPasswordLink } from "../utils/sendEmail.js";
import {getUserPosts} from '../controllers/postsController.js'

const router = express.Router();
const __dirname = path.resolve(path.dirname(""))

router.get("/verify/:userId/:token",verifyEmail)


router.post("/request-passwordreset",requestPasswordReset);
router.get("/reset-password/:userId/:token",resetPassword);
router.post("/reset-password",changePassword);
router.post("/add-interests",addIntrests)
router.delete("/remove-interest",removeInterest);
router.get("/verified",(req,res)=>{
    res.sendFile(path.join(__dirname,"views", "verifiedpage.html"))
})
router.get("/resetpassword",(req,res)=>{
    res.sendFile(path.join(__dirname,"views", "verifiedpage.html"))
})
router.get('/:id/posts', getUserPosts);

export default router;