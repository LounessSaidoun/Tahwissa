import Users from "../models/userModel.js"
import { compareString, createJWT, hashString } from "../utils/index.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";
import Posts from "../models/postModel.js";
import Notifications from "../models/notificationModel.js"
// import places from "../models/placeModel.js"

import dotenv from "dotenv"



export const register = async (req,res,next)=>{
    const {userName,firstName,lastName,email,password} = req.body


    if(!(userName || firstName || lastName || email || password )){ //we have to add the birthDay so we can calculate age dynamicly
        next("veuillez remplir les champs indiqué!");
        return;
    }
     try{
        const userExist = await Users.findOne({email})
        if(userExist){
            next("Email existe déjà");
            return;
        }
        const hashedPassword = await hashString(password)
        const registrationYear = Date().getFullYear();
        const user = await Users.create({
            userName,
            firstName,
            lastName,
            email,
            password: hashedPassword,
            registrationYear
        })
        sendVerificationEmail(user, res);
     }
     catch (error){
        console.log(error);
        res.status(400).json({message: error.message})
     }


}

export const login = async (req,res,next)=>{
    const {email,password} = req.body
    try{
        if(!email || !password){
            next("Veuillez fournir les informations d'identification de l'utilisateur");
            return;
        }
        //find user by email
        const user = await Users.findOne({email})
            .select("+password")
            .populate({
                path: "friends",
                select: "_id userName profilUrl profil_picture"
            })
            .populate({
                path: "places_liked",
                select:"name profilurl profil_picture"
            })
        if(!user){
            next("Email ou mot de passe invalide")
            return;
        }
        if(!user?.verified){
            next("Email de l'utilisateur non vérifié. Veuillez vérifier votre boîte de réception et confirmer votre email.");
            res.status(404).json({
                success:"failed",
                message:"Email de l'utilisateur non vérifié. Veuillez vérifier votre boîte de réception et confirmer votre email."
            })
            return;
        }
        const isMatch = await compareString(password, user?.password)
        if(!isMatch){
            next("Email ou mot de passe invalide")
            return;
        }
        const userNotifications = await Notifications.find({userId: user?.id});
        var unreadCount = 0;
        if(userNotifications.length>0){
            unreadCount = userNotifications.reduce((count, notification) => {
                return notification.read ? count : count + 1;
            }, 0);
        }
        user.password = undefined
        const token = createJWT(user?._id)
        res.status(201).json({
            success: true,
            message:  "Connexion réussie" ,
            user, 
            userNotifications,
            token,
            unreadCount
        })
    }
    catch(error){
        console.log(error)
        res.status(404).json({message: error.message})
    }
}

export const googleAuthVerification = async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails[0].value
    const userDetails = {
    googleId: profile.id,
    email: email,
    firstName: profile.name && profile.name.givenName ? profile.name.givenName : '',
    userName: profile.displayName || profile.name,
    registrationYear: new Date().getFullYear()
    }
    // other fields based on the Google profile
  // Find user based on Google ID
  let user = await Users.findOne({email:email});
  if (!user) {
    // User does not exist, create a new user
    user = await Users.create(userDetails);
  }
  else if(!user.googleId){
    await Users.findByIdAndUpdate({_id:user._id},{$set:{googleId:userDetails.googleId}})
  }
  console.log(accessToken);
  return done(null, user);
}
export const googleSuccessAuth = async (req, res) =>{
    // Successful authentication, redirect to secrets.
    try{
        const user = req.user
        if(user){
            const token = createJWT(user._id)
            const userNotifications = await Notifications.find({user_id: user?.id});
            var unreadCount = 0
            if(userNotifications.length>0){
                unreadCount = userNotifications.reduce((count, notification) => {
                    return notification.read ? count : count + 1;
                }, 0);
            }
            res.status(201).json({
                success: true,
                message:  "Connexion réussie" ,
                user, 
                userNotifications,
                unreadCount,
                token,
    
            })
        }
        else{
            res.status(500).json({message:"Error lors de l'authentification veuillez vous reauthentifier."})
        }
    }catch(error){
        console.log(error)
        res.status(404).json({message:error.message})
    }
  }

  