import Notifications from "../models/notificationModel.js";

export const getNotifications = async (req,res)=>{
    try{
        const {user_id:userId} = req.user;

        if(!userId){
            return res.status(404).json({message:"Utilisateur non trouvé."})
        }
        
        const notifications = await Notifications.find({user_id:userId})
        .populate({
            path:"sender_id",
            select:"profil_picture"
        });
        if (notifications.length > 0) {
            const unreadCount = notifications.reduce((count, notification) => {
                return notification.read ? count : count + 1;
            }, 0);
            res.status(200).json({ notifications, unreadCount});
        } else {
            res.status(404).json({ message: "No notifications found." });
        }
    }catch(error){
        console.log(error);
        res.status(500).json({message:"Erreur interne au serveur."})
    }

}

export const markAsRead = async (req,res)=>{
    try{
        const {user_id:userId} = req.user;
        
        if(!userId){
            return res.status(404).json({message:"Utilisateur non trouvé."});
        }

        const notificationId = req.body.notificationId;
        const updatedNotification = await Notifications.findByIdAndUpdate(
            notificationId,
            { $set: { read: true } },
            { new: true } // Return the updated document
        );

        if (updatedNotification) {
            res.status(200).json({ message: "Notification marquée comme lue.", updatedNotification });
        } else {
            res.status(404).json({ message: "Notification non trouvée." });
        }
    
    }catch(error){
        console.log(error);
        res.status(500).json({message:"Erreur interne au serveur."})
    } 
}

