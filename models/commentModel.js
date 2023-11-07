import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    content: {
      type: String,
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
      required: true,
    },
    post_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post', // Reference to the Post model
    },
    
  },
  {
    timestamps: true // Use Date.now() for createdAt and updatedAt fields
  }
  );

  const Comments = mongoose.model("Comment",commentSchema);

  export default Comments;