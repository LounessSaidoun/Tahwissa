import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
      //required: true, to discuss if posts are added only by users
    },
    place_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Place', // Reference to the Place model
    },
    content: {
      type: String,
      required: true,
    },
    photos: [String],
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
    }],
  },
  {
    timestamps: true // Use Date.now() for createdAt and updatedAt fields
  }
  );

  const Posts = mongoose.model("Post",postSchema);

  export default Posts;