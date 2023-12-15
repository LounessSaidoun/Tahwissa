import mongoose from "mongoose";
import passportLocalMongoose from "passport-local-mongoose"


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
          Ouilaya: {
            type: String,
          },
          birthDate: Date,
          profilUrl: String,
          profil_picture: String,
          languages: [String],
          registrationYear: Number,
          profession:String,
          aProposDeMoi: String,
          domain:String,
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
          interest_checked:{type:Boolean, default:false},
    }
);

userSchema.pre('save', function (next) {
  // Ensure that profilUrl is set to the default value only if it's not provided
  if (this.profilUrl === undefined || this.profilUrl!==`/profil/${this._id}`) {
    this.profilUrl = `/profil/${this._id}`;
  }
  next();
});

userSchema.pre('save', function (next) {
  // Calculate age based on birthdate
  const currentDate = new Date();
  const birthdate = this.birthdate;

  if (!birthdate) {
    // Handle the case where birthdate is not set
    next();
    return;
  }

  const age = currentDate.getFullYear() - birthdate.getFullYear();

  // Adjust age if birthday hasn't occurred yet this year
  if (
    currentDate.getMonth() < birthdate.getMonth() ||
    (currentDate.getMonth() === birthdate.getMonth() && currentDate.getDate() < birthdate.getDate())
  ) {
    this.age = age - 1;
  } else {
    this.age = age;
  }

  next();
});

userSchema.plugin(passportLocalMongoose);
const Users = mongoose.model("User",userSchema);


export default Users;
