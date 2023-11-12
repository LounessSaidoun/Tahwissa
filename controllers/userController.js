import mongoose  from "mongoose";
import Verification from "../models/emailVerificationModel.js";
import Users from "../models/userModel.js";
import { compareString, hashString, verifyJwtToken } from "../utils/index.js";
import PasswordReset from "../models/passwordResetModel.js";
import { resetPasswordLink } from "../utils/sendEmail.js";

export const verifyEmail = async (req,res)=>{
    const {userId,token} = req.params;

    
    try{
        //test if the email user is verified
        const result = await Verification.findOne({userId});
        if(result){
            const {expiresAt, token:hashedToken} = result
            if(expiresAt<Date.now()){
                //token expired
                Verification.findOne({userId})
                .then(()=>{
                    Users.findOneAndDelete({_id: userId})
                    .then(()=>{
                        const message = "Le jeton de vérification a expiré."
                        res.redirect(
                            `/users/verified?status=error&message=${message}`
                        );
                    })
                    .catch((err)=>{
                        res.redirect(`/users/verified?message=`)
                    })


                })
                .catch((error)=>{
                    console.log(error);
                    res.redirect(`/users/verified?message=`)

                })
            }
            else{
                //token valid
                compareString(token, hashedToken)
                .then((isMatch)=>{
                    if(isMatch){
                        Users.findOneAndUpdate({_id: userId},{verified: true})
                        .then(()=>{
                            const message = "Adresse e-mail vérifiée avec succès"
                            res.redirect(
                                `/users/verified?status=success&message=${message}`
                            )
                        })
                    } else{
                        //invalid token the token from the params url dont match with the hashed token from the DB
                        const message = "Vérification échouée ou lien invalide"
                        res.redirect(
                            `/users/verified?status=error&message=${message}`
                        );
                    }
                })
                .catch((err)=>{
                    console.log(err)
                    res.redirect(`/users/verified?message=`)
                })
            }
        } else{
            // user doesn't exist
            const message = "Lien de vérification invalide, veuillez réessayer plus tard"
            res.redirect(
                `/users/verified?status=error&message=${message}`
            );
        }
    }
    catch(error){
        console.log(err)
        res.redirect(`/users/verified?message=`)
    }

}
export const requestPasswordReset = async (req,res)=>{
    try{
        const {email} = req.body
        const user = await Users.findOne({email})
        //si on trouve pas un user avec cet email cas email qui n'pas de compte
        if(!user){
            return res
            .status(404)
            .json({
                status:"Échec",
                message:"Adress email n'existe pas"
            })
        }
            //si on trouve un utilisateur avec l'eamil introduit dans le body 
            const existingRequest = await PasswordReset.findOne({email})
            //si il a déja fait un requeste et son request est dans la base
            if(existingRequest){
                //si la demande de rénsialisation est toujour valide n'a pas expiré dans ce cas il peut rénistialiser normalement son compte
                if(existingRequest.expirseAt>Date.now()){
                    return res.status(201).json({
                        status: "Pending",
                        message: "Le lien de réinitialisation du mot de passe a déjà été envoyé à votre adresse e-mail"

                    })
                }
                // dans le cas ou le lien a expiré
                await PasswordReset.findOneAndDelete({email});
            }
            //dans le cas ou il n a pas déjà fait un request ou il a fait et le request a expiré on evoie un lien créer par la fonction resetPasswordLink
            await resetPasswordLink(user,res)
    }catch(error){
        console.log(error)
        res.status(404).json({message: error.message})
    }

}

export const resetPassword = async (req,res) =>{
    const {userId,token} = req.params
    try{
        const user = await Users.findById(userId)
        if(!user){
            const message = "Lien de réinitialisation de mot de passe invalide. Veuillez réessayer."
            res.redirect(`/users/resetpassword?status=error&message=${message}`)
        }
        const resetPassword = await PasswordReset.findOne({userId})
        if(!resetPassword){
            const message = "Lien de réinitialisation de mot de passe invalide. Veuillez réessayer."
            res.redirect(`/users/resetpassword?status=error&message=${message}`)
        }
        const {expiresAt,token: resetToken} = resetPassword;
        //lien expiré
        if(expiresAt<Date.now()){
            const message = "Lien de réinitialisation de mot de passe invalide. Veuillez réessayer."
            res.redirect(`/users/resetpassword?status=error&message=${message}`)
        }
        else{
            const isMatch = await compareString(token, resetToken)
            if(!isMatch){
                const message = "Lien de réinitialisation de mot de passe invalide. Veuillez réessayer."
                res.redirect(`/users/resetpassword?status=error&message=${message}`)
            }
            else{
                res.redirect(`/users/resetpassword?type=reset&id=${userId}`)
            }
        }

    }catch(error){
        console.log(error)
        res.status(404).json({message: error.message})
    }
}

export const changePassword = async (req,res,next) =>{
    try{
        const {userId, password} = req.body;
        const hashedPassword = await hashString(password);
        //update the password of the user
        const user = await Users.findByIdAndUpdate(
            {_id:userId},
            {password: hashedPassword}
        );

        if(user){
            await PasswordReset.findOneAndDelete({userId})
            const message = "Réinitialisation du mot de passe réussie."
            res.redirect(`/users/verified?status=succes&message=${message}`)
        }
        return;

    }catch(error){
        console.log(error);
        res.status(404).json({message: error.message})
    }
}

export const addIntrests = async (req,res) =>{
    try{
        const token = req.headers.authorization;
        const decodedPayload = verifyJwtToken(token, process.env.JWT_SECRET_KEY);
        if(decodedPayload){
            const userId = decodedPayload.userId;
            const user = await Users.findById({_id:userId});
            const interests = req.body.interests;
            if(interests && interests.length>0){
                const updatedUser = await Users.findOneAndUpdate({_id:user?._id},{$set:{center_of_interest:interests,  interest_checked:true}},{new:true})
                if(updatedUser){
                    res.status(201).json({ 
                        message: "Le centre d'intérêt a été mis à jour avec succès.",
                        center_of_interests: updatedUser.center_of_interest
                
                })
                    return;
                }
                else{
                    res.status(500).json({ message: "Une erreur s'est produite lors de la mise à jour du centre d'intérêt. Veuillez réessayer plus tard." });
                    return;
                }
            }
        }
        else{
            res.status(401).json({ message: "Accès non autorisé. Veuillez vous authentifier pour Choisir vos centres d'intérêt." });
        }
    }
    catch(error){
        console.log(error)
        res.status(404).json({message:error.message})
    }
}

export const removeInterest = async (req,res)=>{
    try{
        const token = req.headers.authorization;
        const decodedPayload = verifyJwtToken(token, process.env.JWT_SECRET_KEY);
        if(decodedPayload){
            const userId = decodedPayload.userId;
            const user = await Users.findById({_id:userId});
            const interest = req.query.interest;
            if(interest){
                const index = user.center_of_interest.findIndex((x)=>x===interest);
                if(index!=-1){
                    user.center_of_interest= user.center_of_interest.slice(0,index).concat(user.center_of_interest.slice(index+1));
                    const updatedUser = await Users.findByIdAndUpdate({_id:userId},{$set:{center_of_interest:user.center_of_interest}}, { new: true })
                    if(updatedUser){
                        res.status(201).json({ 
                            message: "Le centre d'intérêt a été mis à jour avec succès." ,
                            center_of_interests:updatedUser.center_of_interest
                            
                        });
                        return;
                    }
                    else{
                        res.status(500).json({ 
                            message: "Une erreur s'est produite lors de la mise à jour du centre d'intérêt. Veuillez réessayer plus tard."
                            
                        });

                }
                }
            }

            }
            else{
                    res.status(401).json({ message: "Une erreur s'est produite lors de la mise à jour du centre d'intérêt. Veuillez réessayer plus tard."});
                    return;
            }



    }catch(error){
        console.log(error);
        res.status(404).res({message:error.message});
        
    }
}