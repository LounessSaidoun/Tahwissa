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

    },
    
)
const Places = mongoose.model("Place",placeSchema)

export default Places;