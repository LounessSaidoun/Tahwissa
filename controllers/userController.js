import Verification from "../models/emailVerificationModel.js";
import Users from "../models/userModel.js";
import { compareString, hashString} from "../utils/index.js";
import PasswordReset from "../models/passwordResetModel.js";
import { resetPasswordLink } from "../utils/sendEmail.js";
import Posts from "../models/postModel.js";
import aws from 'aws-sdk';

const S3 = aws.S3; // Corrected import
const s3 = new S3();

// Set up AWS SDK with your credentials
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});


import multer from 'multer';
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })



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

export const addInterests = async (req, res) => {
    try {

            // JWT authentication successful, proceed with your logic
            const {user_id:userId} = req.user;
            const user = await Users.findById(userId);
            if(user){
                const interests = req.body.interests;

            if (interests && interests.length > 0) {
                const updatedUser = await Users.findOneAndUpdate(
                    { _id: userId },
                    { $set: { center_of_interest: interests, interest_checked: true } },
                    { new: true }
                );

                if (updatedUser) {
                    return res.status(201).json({
                        message: "Le centre d'intérêt a été mis à jour avec succès.",
                        center_of_interests: updatedUser.center_of_interest,
                    });
                } else {
                    return res.status(500).json({
                        message: "Une erreur s'est produite lors de la mise à jour du centre d'intérêt. Veuillez réessayer plus tard.",
                    });
                }
            } else {
                return res.status(400).json({
                    message: "La liste des centres d'intérêt est vide ou manquante.",
                });
            }
        }else{
            res.status(400).json({message:"Utilisateur non trouvé."})
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Une erreur s'est produite lors de l'ajout des centres d'intérêt. Veuillez réessayer plus tard.",
        });
    }
};


export const removeInterest = async (req, res) => {
        try{
            const {user_id:userId} = req.user;
            const user = await Users.findById(userId);
            if(user){
                const interest = req.body.interest;
            if (interest) {
                const index = user.center_of_interest.findIndex((x) => x === interest);
                console.log(user.center_of_interest)
                if (index !== -1) {
                    user.center_of_interest = user.center_of_interest.slice(0, index).concat(user.center_of_interest.slice(index + 1));
    
                    const updatedUser = await Users.findByIdAndUpdate(userId, { $set: { center_of_interest: user.center_of_interest } }, { new: true });
    
                    if (updatedUser) {
                        return res.status(201).json({
                            message: "Le centre d'intérêt a été mis à jour avec succès.",
                            center_of_interests: updatedUser.center_of_interest
                        });
                    } else {
                        return res.status(500).json({
                            message: "Une erreur s'est produite lors de la mise à jour du centre d'intérêt. Veuillez réessayer plus tard."
                        });
                    }
                }
            }
    
            return res.status(400).json({
                message: "Le centre d'intérêt spécifié n'a pas été trouvé dans la liste de l'utilisateur."
            });
        }else{
            res.status(404).json({message:"Utilisateur non trouvé."})
        }
        }
        catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Une erreur s'est produite lors de la mise à jour du centre d'intérêt. Veuillez réessayer plus tard." });
    }
}

export const updateProfilInformations = async (req,res) =>{
    try{
        const {user_id:userId}=req.user;
        const user = await Users.findById(userId)
        let profil_picture = user.profil_picture; // Default to existing picture
        if (req.file) {
          // A new file is uploaded
          const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: `profile-pictures/${userId}-${Date.now()}-${req.file.originalname}`,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
          };
    
          const s3Response = await s3.upload(params).promise();
          profil_picture = s3Response.Location;
        }
    
        if(user){
            console.log(user.userName)
            const updatedProfile={
                _id:userId,
                userName: req.body.userName !== undefined ? req.body.userName : user.userName,
                firstName: req.body.firstName !== undefined ? req.body.firstName : user.firstName,
                lastName: req.body.lastName !== undefined ? req.body.lastName : user.lastName,
                gender: req.body.gender !== undefined ? req.body.gender : user.gender,
                city: req.body.city !== undefined ? req.body.city : user.city,
                Ouilaya: req.body.Ouilaya !== undefined ? req.body.Ouilaya : user.Ouilaya,
                aProposDeMoi: req.body.aProposDeMoi !== undefined ? req.body.aProposDeMoi : user.aProposDeMoi,
                interests:  req.body.interests !== undefined ? req.body.interests : user.interests,
                languages: req.body.languages !== undefined ? req.body.languages : user.languages ,
                profil_picture,
                }
                await Users.updateOne({ _id: updatedProfile._id }, { $set: updatedProfile})
                .then(()=>{
                    console.log(updatedProfile)
                    res.status(201).json({user:updatedProfile});
                }).catch((err)=>{
                    console.log(err)
                    res.status(500).json({message:"Une erreur s'est produite lors de la mis à jour de profil. Veuillez vous réssayer plus tard."})
                })
            }
            else{
                res.status(500).json({ message: "Une erreur s'est produite lors de la mise à jour du centre d'intérêt. Veuillez réessayer plus tard."});
                return;
            }
        

    }catch(error){
        console.log(error);
        res.status(500).json({ message: "Une erreur s'est produite lors de la mise à jour du profil. Veuillez réessayer plus tard." });
    }
}

export const getProfilInfo = async (req,res)=>{
    try{
        const userId = req.params.userId;
        const user = await Users.findById(userId)
        .populate({
            path: "friends",
            select: "_id userName profilUrl profil_picture"
        });
       
        if(user){
            const posts = await Posts.find({user_id:userId})
            const sortedPosts = posts.sort((a, b) => b.likes.length - a.likes.length);
            let profilePicture = null;

            if (user.profile_picture) {
              profilePicture = await s3.getSignedUrlPromise("getObject", {
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: user.profile_picture,
                Expires: 3600,
              });
            }
            const userInfo = {
                    id: user._id, 
                    userName: user.userName,
                    email:user.email,
                    interests:user.center_of_interest,
                    profile_picture:user.profile_picture,
                    languages: user.languages,
                    age: user.age,
                    gender: user.gender,
                    registrationYear: user.registrationYear,
                    profession: user.profession,
                    domain: user.domain,
                    city: user.city,
                    Ouilaya: user.Ouilaya,
                    aProposDeMoi: user.aProposDeMoi,
                    friends:user.friends,
                    sortedPosts:sortedPosts,
                    profil_picture:profilePicture
                }
                res.status(200).json(userInfo);
            }
            else{
                res.status(500).json({message:"Une erreur s'est produite lors de la récupération du profil utilisateur."})
            }
    }catch(error){
        console.log(error);
        res.status(404).json({message:"Une erreur s'est produite lors de la récupération du profil utilisateur."})
    }
}

export const deleteAccount = async (req,res,next)=>{
    try{
        const token = req.headers.authorization;
        const decodedPayload = verifyJwtToken(token, process.env.JWT_SECRET_KEY);
        if(decodedPayload){
            const password = req.body.password;
            const user = await Users.findById(decodedPayload.userId)
            .select(password)
            if(user){
                const isMatch = compareString(user.password,password)
                if(!isMatch){
                    next("Email ou mot de passe invalide")
                    return;
                } 
                else{
                    Users.updateOne({_id:user._id},{$set:{deleted:true,expiryDeleteDate:new Date()}})
                    .then(()=>{
                        res.status(201).json( { 
                            message: "Votre compte a été marqué pour suppression. Vous pouvez le récupérer avant un mois. Passé ce délai, votre compte sera supprimé définitivement."
                        })
                    })
                    .catch((err)=>{
                        console.log(err);
                        res.status(500).json({message:err.message})
                    })
                }
            }
            else{
                res.status(404).json({message:"Utilisateur non trouvé."})
            }
        }
        else{
            res.status(500).json({message:"Une erreur s'est produite lors de la suppression de votre compte.Veuillez vous authentifier."})
        }

    }catch(error){
        console.log(error)
        res.status(404).json({message:error.message})
    }
}

export const removeFriend = async (req,res)=>{
    try{
        const {user_id:userId} = req.user;
        const user = await Users.findById(userId)
        if(user){
            const removedFriendId = req.body.friendId
            const removedFriend = await Users.findById(removedFriendId)
            if(removedFriend){
                //find the index of id friend to remove in the user list friend
                const removedFriendIdIndex = user.friends.findIndex((friendId)=>friendId.equals(removedFriend._id))
                //find the index of the id user in the list of friends of his friend
                const userIdIndex = removedFriend.friends.findIndex((friendId)=>friendId.equals(user._id))
                //test if  the ids have been founded 
                if(userIdIndex!==-1 && removedFriendIdIndex!==-1){
                //deleting the id of removedfriend from the list of friends of the user 
                user.friends = user.friends.slice(0,removedFriendIdIndex).concat(user.friends.slice(removedFriendIdIndex+1))
                //deleting the user from the friend list 
                removedFriend.friends = removedFriend.friends.slice(0,userIdIndex).concat(removedFriend.friends.slice(userIdIndex+1))
                await Users.findByIdAndUpdate({_id:user._id},{$set:{friends:user.friends}}, { new: true })
                .then(async ()=>{
                    await Users.findByIdAndUpdate({_id:removedFriend._id},{$set:{friends:removedFriend.friends}}, { new: true })
                    .then(()=>{
                        res.status(201).json({message:`Vous avez supprimé ${removedFriend.userName} avec succés.`})
                    })
                    .catch((err)=>{
                        console.log(err)
                        res.status(500).json({message:"Une erreur s'est produite lors de la suppression de votre ami."})
                    })
                }).catch((err)=>{
                    console.log(err)
                    res.status(500).json({message:"Une erreur s'est produite lors de la suppression de votre ami."})
                })
            }
            else{
                res.status(500).json({message:"Une erreur s'est produite lors de la suppression de votre ami.Peut être que vous l'avez supprimé avant."})
            }
        }
        else{
            res.status(404).json({message:"Ami non trouvé."})
        } 
     }
     else{
        res.status(404).json({message:"Utilisateur non trouvé."})
        } 
    }
    catch(error){
        console.log(error);
        res.status(404).json({message:error.message})
    }
}

