import express from "express"
import {login, register} from "../controllers/authController.js";
import passport from "passport";

const { authenticate } = passport;

const router = express.Router();

router.post("/register",register)
router.post("/login",login)
export default router;