import Posts from '../models/postModel.js' ;
import Comments from '../models/commentModel.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import aws from 'aws-sdk';
import Notifications from "../models/notificationModel.js";
import {io} from "../index.js"
import Users from '../models/userModel.js';

dotenv.config()

const S3 = aws.S3; // Corrected import
const s3 = new S3();

// Set up AWS SDK with your credentials
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});


// Get all articles
const getPosts= async (req, res) => {
    try {
        const allPosts = await Posts.find();
        res.json(allPosts);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const createPost = async (req, res) => {
    try {

      const { user_id } = req.user;


      const files = req.files; 
      if (!files || !Array.isArray(files)) {
        return res.status(400).json({ error: 'No files provided or invalid files format' });
      }

      const {user_name ,place_id ,content, photos,likes ,title} = req.body;

      const imageUrls = await Promise.all(
        files.map(async (file) => {
          const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: `uploads/${Date.now()}-${file.originalname}`,
            Body: file.buffer,
            ContentType: file.mimetype,
            // ACL: 'public-read',
          };
  
          const s3Response = await s3.upload(params).promise();
          return s3Response.Location;
        })
      );

      const newPost = {
        user_name:user_name,
        user_id: user_id,
        place_id: place_id,
        content: content,
        title:title,
        photos: imageUrls.map((url) => {
          // Extract the filename from the URL
          const filename = url.split('/').pop();
  
          // Construct the new path with user_id and post_id
          const newPath = `uploads/${user_name}/${filename}`;
  
          // Update the URL with the new path
          return url.replace(`uploads/${filename}`, newPath);
        }),
        likes: likes,
      };
      const savedPost = await new Posts(newPost).save();

      res.json(savedPost);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });

    }

  };
  
  const updatePost = async (req, res) => {
    try {
      const postId = req.params.id; // Assuming you have the post ID in the request parameters
      const files = req.files;
      const existingPost = await Posts.findById(postId);
      

      if (!existingPost) {
        return res.status(404).json({ error: 'Post not found' });
      }
  
      existingPost.content = req.body.content || existingPost.content;
      existingPost.likes = req.body.likes || existingPost.likes;
      // const user = decodeURIComponent(req.body.user_name);
      const user = req.body.user_name.toString();
      console.log(user);
      if (files && Array.isArray(files)) {
        const imageUrls = await Promise.all(
          files.map(async (file) => {
            const params = {
              Bucket: process.env.AWS_S3_BUCKET_NAME,
              Key: `uploads/${user}/${existingPost._id}/${Date.now()}-${file.originalname}`,
              Body: file.buffer,
              ContentType: file.mimetype,
            };
  
            const s3Response = await s3.upload(params).promise();
            return s3Response.Location;
          })
        );
  
        existingPost.photos = [...existingPost.photos, ...imageUrls];
      }
      const updatedPost = await existingPost.save();
  
      res.json(updatedPost);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };


const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const deletedPost = await Posts.findByIdAndDelete(postId);

    if (!deletedPost) {
      return res.status(404).json({ error: 'Post not found' });
    }
    // console.log('AWS Credentials:', aws.config.credentials);


    // Delete pictures from the cloud bucket
    const pictureUrls = deletedPost.photos;

    if (pictureUrls && Array.isArray(pictureUrls)) {
      pictureUrls.forEach(async (url) => {
        const filename = url.split('/').pop();
        const params = {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: `uploads/${deletedPost.user_name}/${deletedPost._id}/${filename}`,
        };

        await s3.deleteObject(params).promise();
      });
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

//get posts od a specific user 
//works
const getUserPosts = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find posts for the user by user_id
    const posts = await Posts.find({ user_id: id }).sort({ createdAt: 1 });

    // Map over the posts and directly retrieve signed URLs for photos
    const postsWithSignedUrls = await Promise.all(
      posts.map(async (post) => {
        const photosWithSignedUrls = await Promise.all(
          post.photos.map(async (photo) => {
            const signedUrl = await s3.getSignedUrlPromise('getObject', {
              Bucket: process.env.AWS_S3_BUCKET_NAME,
              Key: photo,
              Expires: 3600, // Set the expiration time for the signed URL
            });

            return signedUrl;
          })
        );

        // Add the signed URLs to the post
        post.signedPhotoUrls = photosWithSignedUrls;

        return post;
      })
    );

    res.status(200).json({
      success: true,
      message: 'Successfully retrieved user posts',
      data: postsWithSignedUrls,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};


const getPostDetails = async (req, res, next) => {
  try {
    const { post_id } = req.params;
    console.log(post_id);

    // Find the post by post ID and populate user and place details
    const post = await Posts.findById(post_id) 
    .populate({
      path: 'user_id',
      select: 'user_name', 
    })
    .populate({
      path: 'place_id',
      select: 'name city', 
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }


    // Map over the post photos and retrieve signed URLs for images from the cloud bucket
    const photosWithSignedUrls = await Promise.all(
      post.photos.map(async (photo) => {
        const signedUrl = await s3.getSignedUrlPromise('getObject', {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: photo,
          Expires: 3600, // Set the expiration time for the signed URL
        });

        return signedUrl;
      })
    );

    // Add the signed URLs to the post
    post.signedPhotoUrls = photosWithSignedUrls;

    res.status(200).json({
      success: true,
      message: 'Successfully retrieved post details',
      data: post,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const likePost = async (req, res) => {
  try {
    const { id } = req.params; // Post ID
    // const { user_id } = req.body; // User ID
    const {user_id} = req.user;

    const post = await Posts.findById(id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Find the index of the user in the likes array
    const indexToRemove = post.likes.findIndex((like) => like.equals(user_id));
    if (indexToRemove!==-1) {
       // User has already liked the post, unlike it
       // Use slice and concat to create a new array without the user at the found index
       post.likes = post.likes.slice(0, indexToRemove).concat(post.likes.slice(indexToRemove + 1));
       //save the post
       const updatedPost = await post.save();
      //inform the client side that the post is unliked without any problem
      return res.status(200).json({ message: 'Post unliked successfully.',updatedPost })
    } else {
      //find the user who is liking the posts to send a notification
      const user = await Users.findById(user_id);
      
      if(!user){
        res.status(404).json({error:"User not found"})
      }
      else{
        // User hasn't liked the post, like it
        post.likes.push(user_id);
        const updatedPost = await post.save();
        //creating the notification
        const notification = {
        user_id: post.user_id,
        sender_id: user_id,
        type: 'like',
        content: `${user.userName} a aimé votre post.`,
      };
      await Notifications.create(notification);
      
      //testing if the user is connecting to the socket server so we can send him the notification in real time
      const recipientSocket = io.sockets.sockets[post.user_id];
    
      if (recipientSocket) {
        //sending a notification post,user,notification 
        recipientSocket.emit('likepost', {updatedPost,user,notification});
      }
      res.status(201).json({ message: 'post is liked successfully.'})
      }

    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const addComment = async (req, res) => {
  try {
    const {user_id} = req.user;
    const { content } = req.body;
    const { post_id } = req.params;

    if (content === null) {
      return res.status(404).json({ message: "Comment is required." });
    }

    const post = await Posts.findById(post_id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const user = await Users.findById(user_id);

    if(!user){
      res.status(404).json({error:"User not found."})
    }
    else{
        // Create a new comment
        const newComment = new Comments({
          user_id,
          post_id,
          content,
        });
        
        // Save the comment to the database
        const savedComment = await newComment.save();

        // Add the comment to the post's comments array
        post.comments.push(savedComment._id);
        await post.save();

        //creating the notification
        const notification = {
        user_id: post.user_id,
        sender_id: user_id,
        type: 'comment',
        content: `${user.userName} a commenté votre post.`,
      };
      await Notifications.create(notification);
      
      //testing if the user is connecting to the socket server so we can send him the notification in real time
      const recipientSocket = io.sockets.sockets[post.user_id];
      
      if (recipientSocket) {
         //sending a notification post,user,notification 
         recipientSocket.emit('commentpost', {post,user,notification,savedComment});
       }
       res.status(201).json({ message: 'a post commented successfully.'})
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};




export { 
  getPosts , 
  createPost,
  updatePost,
  deletePost ,
  getUserPosts ,
  getPostDetails,
  likePost,
  addComment
};
