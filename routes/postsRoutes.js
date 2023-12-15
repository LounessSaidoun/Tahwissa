import express from 'express';
import {
     createPost, 
     getPosts,
     updatePost,
     deletePost,
     getPostDetails ,
     likePost,
     addComment
    } from "../controllers/postsController.js";
import userAuth from '../middleware/authmiddleware.js'
import multer from 'multer';
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })


const router = express.Router();
//get all posts 
router.get('/', getPosts);
//create a new post 
router.post('/create' , userAuth , upload.array('photos', 3), createPost);
//updating a post
router.put('/:id/update' ,upload.array('photos', 3), updatePost);
//deleting a post
router.delete('/:id/delete',deletePost);
//getting the post's detilas 
router.get('/:post_id/details',getPostDetails)
//to like a certain post
router.post("/like/:id" , userAuth ,likePost);
//to add a comment
router.post('/comment/:post_id', userAuth , addComment)

// userAuth, upload.array('photos', 3),
export default router ;     