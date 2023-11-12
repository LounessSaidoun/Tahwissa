import mongoose from "mongoose";


const userSchema = new mongoose.Schema(
    {
        googleId:String,
        userName: {
            type: String,
            required: true
          },
          firstName:{
            type: String,
            required: true
          },
          lastName: {
            type: String,
            require: true
          },
          age: Number,
          email: {
            type: String,
            required: [true,"Le champ email doit être obligatoirement rensigné"],
            unique: true,
          },
          password: {
            type: String,
            minlength: [8,"La taille de mot de passe doit dépasser 8 charactères"],
          },
          gender: {
            type: String,
            enum: ["Male", "Female"],
          },
          city: {
            type: String,
          },
          address: {
            type: String,
          },
          profilUrl:{
            type: String,
            required: true,
          },
          profil_picture: String,
          center_of_interest: [String],
          friends: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
            },
          ],
          places_liked: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Place',
            },
          ],
          posts_liked: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Post',
            },
          ],
          articles_liked: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Article',
            },
          ],
          verified: {type:Boolean, default:false},
          interest_checked:{type:Boolean, default:false}
    }
)

const Users = mongoose.model("User",userSchema);


export default Users;
