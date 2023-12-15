import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
      required: true,
    },
    content: {
      type: String,
    },
    photos: [String],
    title: {
      type: String,
      // required: true,
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
    }],
    comments: [{ 
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment" }],
  },
  {
    timestamps: true // Use Date.now() for createdAt and updatedAt fields
  }
  );

  const Posts = mongoose.model("Post",postSchema);

  export default Posts;