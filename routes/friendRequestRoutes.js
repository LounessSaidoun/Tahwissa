import express from "express"
import {cancelFriendRequest, sendFriendRequest,answerFriendRequest} from "../controllers/friendRequestController.js"
import userAuth  from "../middleware/authmiddleware.js"

const router =express.Router();


router.post("/send-friend-request",userAuth,sendFriendRequest)
router.delete("/cancel-friend-request",cancelFriendRequest)
router.post("/answer-friend-request",userAuth,answerFriendRequest)

export default router;