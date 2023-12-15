import mongoose from "mongoose";


const notificationSchema = new mongoose.Schema({
  user_id: {
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
  //dans le cas ou la notification est généré à partir d'un post que se soit un like ou un comment
  post_id:{
    type: mongoose.Schema.Types.ObjectId,
    ref:'Post'
  },
  //en cas ou la notification est généré à partir d'un commentaire juste pour l UI 
  comment_id:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }
});

const Notifications = mongoose.model("Notification",notificationSchema);

export default Notifications;