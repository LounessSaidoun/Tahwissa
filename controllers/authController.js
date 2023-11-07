import Users from "../models/userModel.js"
import { compareString, createJWT, hashString } from "../utils/index.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";
import Posts from "../models/postModel.js";
import Notifications from "../models/notificationModel.js"
import places from "../models/placeModel.js"

import dotenv from "dotenv"



export const register = async (req,res,next)=>{
    const {userName,firstName,lastName,email,password} = req.body


    if(!(userName || firstName || lastName || email || password )){
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
        const user = await Users.create({
            userName,
            firstName,
            lastName,
            email,
            password: hashedPassword,
            profilUrl: `/profil/${userName}`
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
                select: "userName profilURL profil_picture"
            })
            .populate({
                path: "places_liked",
                select:"name profilURL profil_picture"
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
        const userPosts = await Posts.find({ user_id: user?._id }); //get the posts of the user
        const userNotifications = await Notifications.find({userId: user?.id});
        user.password = undefined
        const token = createJWT(user?._id)
        res.status(201).json({
            success: true,
            message:  "Connexion réussie" ,
            user, 
            userPosts,// it can be empty so when you link you have to test if its length!=0 
            userNotifications,
            token,

        })
    }
    catch(error){
        console.log(error)
        res.status(404).json({message: error.message})
    }
}

