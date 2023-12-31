import express from 'express';
import { getArticles, getArticleDetail ,addArticle,likeArticle , modifyArticle} from '../controllers/articlesController.js';
import userAuth from '../middleware/authmiddleware.js'

import multer from 'multer';
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
const router = express.Router();

//add articles 
router.post('/add' ,upload.array('photos' , 8),addArticle );

// Get all articles
router.get('/', getArticles);

// Get details of a specific article
router.get('/:id', getArticleDetail);
//liking an article only if you are authorized
router.post('/like/:id' ,userAuth,likeArticle );
router.patch('/modify/:id', upload.array('photos'), modifyArticle);




export default router;
