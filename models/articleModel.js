import mongoose from "mongoose";

const articleSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
          },
          content: {
            type: String,
            required: true,
          },
          author_name: {
            type: String,
            required: true,
          },
          publication_date: {
            type: Date,
            default: Date.now,
          },
          place_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Place', // Reference to the Place model
            required: true,
          },
          likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Reference to the User model
          }],
    }
)
const Articles = mongoose.model("Article",articleSchema);

export default Articles;