import nodemailer from "nodemailer"
import dotenv from "dotenv"
import {v4 as uuidv4} from "uuid"
import { hashString } from "./index.js";
import Verification from "../models/emailVerificationModel.js"
import PasswordReset from "../models/passwordResetModel.js";

dotenv.config();

const {AUTH_EMAIL,AUTH_PASSWORD,APP_URL} = process.env;

let transporter = nodemailer.createTransport(
    {
        host: 'smtp.gmail.com', // Use the Gmail service
        auth: {
            user: AUTH_EMAIL, // Your Gmail email address
            pass: AUTH_PASSWORD, // Your Gmail password or app-specific password
        },
    }
)

export const sendVerificationEmail = async (user,res) => {
    const {_id,email,userName} = user;
    const token = _id +uuidv4();
    const link = APP_URL + "users/verify/" + _id + "/" + token;
    const mailOptions = {
        from: AUTH_EMAIL,
        to: email,
        subject: "Verification de votre email",
        html: `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; background-color: #f8f8f8; padding: 20px;">
        <h1 style="color: #007bff;">Veuillez vérifier votre adresse e-mail</h1>
        <hr>
        <h4>Salut ${userName},</h4>
        <p>Veuillez vérifier votre adresse e-mail pour que nous puissions confirmer que vous êtes bien vous.
            <br><p>Avant de continuer, veuillez vérifier votre adresse e-mail. Ce lien expirera dans 1 heure. Pour ce faire, <a href="${link}" style="color: #007bff; text-decoration: none;">cliquez ici</a>.</p>
        </p>
        <h5>Cordialement,</h5>
        <h5>L'équipe de Tahwissa</h5>
    </div>
    `
};
try{
    const hashedToken = await hashString(token);
    const newVerifiedEmail = await Verification.create({
        userId: _id,
        token: hashedToken,
        createdAt: Date.now(),
        expiresAt: Date.now()+(3600*1000) // 3600 ms * 1000 = 3600s = 1h
    })
    if(newVerifiedEmail){
        transporter
         .sendMail(mailOptions)
         .then(()=>{
            res.status(201).send({
                sucess: "PENDING",
                message: `Bienvenue ${userName} dans l'équipe Tahwissa! Un e-mail de vérification a été envoyé à votre compte. Veuillez consulter votre boîte de réception pour plus d'instructions.`
            });
         })
         .catch((err)=>{
            console.log(err);
            res.status(404).json({message:"Quelque chose s'est mal passé" })
         })
    }

}
catch(error){
    console.log(error);
    res.status(404).json({message: "Quelque chose s'est mal passé" })
}

}

export const resetPasswordLink = async (user,res) =>{
    const {_id,userName, email} = user
    const token = _id + uuidv4();
    //lien a envoyé a l'utilisateur si il veux rénitisaliser le mot de passe
    const link = APP_URL + "users/reset-password/"+_id+"/"+token
    //l'email de rénsialitation de mot de passe
    const mailOptions = {
        from: AUTH_EMAIL,
        to: email,
        subject: "Réinitialisation de mot de passe",
        html: `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; background-color: #f4f4f4; padding: 20px;">
        <h1 style="color: #007ACC; font-weight: bold;">Réinitialisation de mot de passe</h1>
        <hr>
        <p>Bonjour ${userName},</p>
        <p>Nous avons reçu une demande de réinitialisation de votre mot de passe.</p>
        <p>Veuillez cliquer sur le lien ci-dessous pour réinitialiser votre mot de passe. Le lien expirera dans dix minutes.</p>
        <p><a href="${link}" style="text-decoration: none; color: #007ACC;">Réinitialiser le mot de passe</a></p>
        <p>Si vous n'avez pas fait cette demande, vous pouvez ignorer cet e-mail.</p>
        <h5 style="font-weight: bold;">Cordialement,</h5>
        <h5 style="font-weight: bold;">L'équipe Tahwissa</h5>
    </div>
    `};
    try{
        const hashedToken = await hashString(token);
        const resetEmail = await PasswordReset.create({
            userId: _id,
            email: email,
            token: hashedToken,
            createdAt: Date.now(),
            expiresAt: Date.now() + 600000
        })
        if(resetEmail){
            transporter
            .sendMail(mailOptions)
            .then(()=>{
                res.status(201).send({
                    status: "PENDING",
                    message: "Le lien de réinitialisation du mot de passe a été envoyé à votre compte."

                })
            })
            .catch((err)=>{
                console.log(err)
                res.status(404).json({message: "Quelque chose s'est mal passé"})
            })
        }

    }catch(error){
        console.log(error)
        res.status(404).json({message: "Quelque chose s'est mal passé"})
    }




}