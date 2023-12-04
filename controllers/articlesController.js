import Articles from '../models/articleModel.js';
import aws from 'aws-sdk';
import dotenv from 'dotenv';
dotenv.config()

const S3 = aws.S3; 
const s3 = new S3();

aws.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });
  

// Get all articles
const getArticles = async (req, res) => {
    try {
        const articles = await Articles.find();

        res.json(articles);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getArticleDetail = async (req, res) => {
    const articleId = req.params.id;

    try {
        const article = await Articles.findById(articleId)
            .populate({
                path: 'place_id', // Assuming place_id is a reference to the Place model
                select: 'name location city', // Add other fields you want to select
            })
            .exec();

        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }

        // Assuming photos is an array of file paths, replace with signed URLs as needed
        const photosWithSignedUrls = await Promise.all(
            article.photos.map(async (photo) => {
                const signedUrl = await s3.getSignedUrlPromise('getObject', {
                    Bucket: process.env.AWS_S3_BUCKET_NAME, 
                    Key: photo,
                    Expires: 3600,
                });

                return signedUrl;
            })
        );

        // Replace the original photos array with signed URLs
        article.photos = photosWithSignedUrls;

        res.json(article);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const addArticle = async (req, res) => {
    try {
  
      const files = req.files;
      if (!files || !Array.isArray(files)) {
        return res.status(400).json({ error: 'No files provided or invalid files format' });
      }
  
      const  {title , content,author_name,place_id,type,likes} = req.body;
  
      const imageUrls = await Promise.all(
        files.map(async (file) => {
          const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: `uploads/${Date.now()}-${file.originalname}`,
            Body: file.buffer,
            ContentType: file.mimetype,
          };
  
          const s3Response = await s3.upload(params).promise();
          return s3Response.Location;
        })
      );
  
      const newArticle = {
        title: title,
        content: content,
        author_name:author_name,
        place_id: place_id,
        type:type,
        photos: imageUrls.map((url) => {
          const filename = url.split('/').pop();
          const newPath = `uploads/${filename}`;
          return url.replace(`uploads/${filename}`, newPath);
        }),
        likes: likes,
      };
  
      const savedArticle = await new Articles(newArticle).save();
  
      res.json(savedArticle);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  

const likeArticle = async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.user; // Assuming you have a user object in your request

    try {
        if (!user_id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const article = await Articles.findById(id);

        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }

        const isLiked = article.likes.includes(user_id);

        if (isLiked) {
            // User has already liked the article, unlike it
            article.likes = article.likes.filter((like) => like !== user_id);
        } else {
            // User hasn't liked the article, like it
            article.likes.push(user_id);
        }

        const updatedArticle = await article.save();

        // Optionally, you can send the updated article as a response
        res.json(updatedArticle);
    } catch (error) {
        console.error(error);

        // Handle specific error cases and respond with appropriate status codes and messages
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Invalid input data' });
        } else if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid article ID' });
        }

        res.status(500).json({ error: 'Internal Server Error' });
    }
};


export { likeArticle , getArticles ,addArticle,getArticleDetail};
