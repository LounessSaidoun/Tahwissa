import mongoose from "mongoose";
import { stringify } from "uuid";

const placeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
          },
          location: {
            type: {
              latitude: Number,
              longitude: Number,
            },
            required: true,
          },
          city: {
            type: String,
            required: true,
          },
          region: {
            type: String,
            enum: ['est', 'ouest', 'nord', 'sud'],
          },
          tags: [String],
          photos: [String],  // Store photo URLs directly as an array of strings.
          profil_picture: String,
          profil_url: String,
          album: [String]
    },
    
)
const Places = mongoose.model("Place",placeSchema)

export default Places;