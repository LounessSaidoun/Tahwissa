import { verify } from "crypto";
import express from "express"
import path from "path"
import { changePassword, requestPasswordReset, resetPassword, 
    verifyEmail, addInterests, removeInterest, updateProfilInformations, getProfilInfo, 
     removeFriend} from "../controllers/userController.js";
import { resetPasswordLink } from "../utils/sendEmail.js";
import userAuth  from "../middleware/authmiddleware.js";
import multer from 'multer';
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })


const router = express.Router();
const __dirname = path.resolve(path.dirname(""))

router.get("/verify/:userId/:token",verifyEmail)


router.post("/request-passwordreset",requestPasswordReset);
router.get("/reset-password/:userId/:token",resetPassword);
router.post("/reset-password",changePassword);
router.post("/add-interests",userAuth,addInterests)
router.delete("/remove-interest",userAuth,removeInterest);
router.get("/verified",(req,res)=>{
    res.sendFile(path.join(__dirname,"views", "verifiedpage.html"))
})
router.get("/resetpassword",(req,res)=>{
    res.sendFile(path.join(__dirname,"views", "verifiedpage.html"))
})

router.patch("/update-profile",userAuth,upload.single('profil_picture'),updateProfilInformations)

router.get("/profil/:userId",getProfilInfo)

//router.delete("/delete-account",deleteAccount);
router.delete("/remove-friend",userAuth,removeFriend)


export default router;