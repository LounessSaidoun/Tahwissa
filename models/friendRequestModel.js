import mongoose from "mongoose";

const friendRequestSchema = new mongoose.Schema({
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
      required: true,
    },
    receiver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "ignored"],
      default: "pending", // Default status is "pending"
    },
  });

  const FriendRequests = mongoose.model("FriendRequest",friendRequestSchema);
  
  export default FriendRequests;