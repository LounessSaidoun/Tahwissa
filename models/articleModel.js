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
          type: {
            type: String,
            required: true,
            enum: ['art', 'Restaurant', 'place','experience'],
          },
          likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Reference to the User model
          }],
          photos: [String],
          tags: [String],
          sub_title :{type : String}  , 
          small_description:{type:String},



    }
)
const Articles = mongoose.model("Article",articleSchema);

export default Articles;