import mongoose, { mongo } from "mongoose";


const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
  },
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
  },
  type: {
    type: String,
    enum: ['friend_request', 'acceptance', 'like', 'comment'], // Add other notification types as needed
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
  },
});

const Notifications = mongoose.model("Notification",notificationSchema);

export default Notifications;