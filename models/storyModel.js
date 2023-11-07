import mongoose from "mongoose";

const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  viewers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
    },
  ],
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
  },
  place_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Place', // Reference to the Place model
  },
});

const Stories = mongoose.model("Story",storySchema);
export default Stories;