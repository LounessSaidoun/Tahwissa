import express from "express"
import {googleSuccessAuth, login, register} from "../controllers/authController.js";
import passport from "passport";



const router = express.Router();

router.post("/register",register)
router.post("/login",login)
router.get("/google/callback",
  passport.authenticate('google', { failureRedirect: "/login" }),
  googleSuccessAuth
 );
router.get("/google",
  passport.authenticate('google', { scope: ["profile","email"], access_type: "offline"} ),
);

export default router;