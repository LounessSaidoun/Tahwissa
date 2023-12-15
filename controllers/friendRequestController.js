import mongoose from "mongoose";
import Users from "../models/userModel.js"
import FriendRequests from "../models/friendRequestModel.js"
import Notifications from "../models/notificationModel.js";
import {io} from "../index.js"

export const sendFriendRequest = async (req, res) => {
  try {
    const {user_id:senderUserId} = req.user
    if(senderUserId){
      const { recipientUserId } = req.body;
      const existingFriendRequest = await FriendRequests.findOne({sender_id:senderUserId,receiver_id:recipientUserId});
      //gérer le cas ou la demande déjà existe
      if(existingFriendRequest && existingFriendRequest.status==="pending"){
        return res.status(400).json({
        message: 'Existing friend request found',
        existingFriendRequest: existingFriendRequest, // Include details if needed
      });
    }

    //le reste de code ou la demande est nouvelle demande et elle n'existe pas dans la base

    // Créer la demande d'ami
    const friendRequest = {
      sender_id: senderUserId,
      receiver_id: recipientUserId,
    };

   

    // Enregistrer la demande d'ami dans la base de données
    await FriendRequests.create(friendRequest);

    const user = await Users.findById(senderUserId);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur expéditeur non trouvé' });
    }

    const notification = {
      user_id: recipientUserId,
      sender_id: senderUserId,
      type: 'friend_request',
      content: `${user.userName} vous a envoyé une demande d'ami.`,
    };

    // Enregistrer la notification dans la base de données
    await Notifications.create(notification);
    const recipientSocket = io.sockets.sockets[recipientUserId];
    
    if (recipientSocket) {
      recipientSocket.emit('friendRequest', {user,notification,friendRequest});
    }
    res.status(201).json({ message: 'Demande d\'ami envoyée avec succès' });

    }
    else{
      res.status(404).json({message:"Utilisateur non trouvé"})
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

export const cancelFriendRequest = async (req, res) => {
  try {
      const {user_id:sender_id} = req.user;
      const receiver_id = req.body.receiver_id;

      const sender = await Users.findById(sender_id);
      const receiver = await Users.findById(receiver_id);

      if (sender && receiver) {
        const result = await FriendRequests.deleteOne({ sender_id, receiver_id });

        if (result.deletedCount > 0) {
          return res.status(201).json({
            message: `Demande d'ajout annulée avec succès.`,
            canceledRequest: {
              sender: {
                userId: sender._id,
                userName: sender.userName,
              },
              receiver: {
                userId: receiver._id,
                userName: receiver.userName,
              },
            },
          });
        } else {
          return res.status(404).json({
            error: "La demande d'ajout n'a pas été trouvée.",
          });
        }
      } else {
        return res.status(404).json({
          error: "L'un des utilisateurs n'a pas été trouvé.",
        });
      }
    }
    catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
};


export const answerFriendRequest = async (req, res) => {
  try {
    //verify the token if it is valid 
    const {user_id:receiver_id} = req.user;
    if(receiver_id){
      //get the friendRequestId and the response 
      const { friendRequestId,response,notificationId } = req.body;
      //get the friend request to modify it 
      const friendRequest = await FriendRequests.findById(friendRequestId);
      //case friend request not founded.
      if (!friendRequest) {

        return res.status(404).json({ message: "Demande d'ajout n'est pas trouvé." });
      }
      if(friendRequest.status==="pending"){
        //cas of accepted invitation
        if (response === 'accepted') {
          //update the user who sned the invitation update his list of friends
          const senderUser = await Users.findByIdAndUpdate(
            { _id: friendRequest.sender_id },
            { $push: { friends: friendRequest.receiver_id } },
            { new: true }
            );
            //case sender not founded 
            if (!senderUser) {
              return res.status(404).json({ message: "Utilisateur expéditeur non trouvé." });
            }
            //update the list of friends of the user who receive the invitation and accept it
            const receiverUser = await Users.findByIdAndUpdate(
              { _id: receiver_id},
              { $push: { friends: friendRequest.sender_id } },
              { new: true }
              );
              //case receiver not founded
              if (!receiverUser) {
                return res.status(404).json({ message: "Utilisateur destinataire non trouvé." });
              }
              //update the status of friend request from pending to accepted.
              await FriendRequests.updateOne({ _id: friendRequest._id }, { $set: { status: 'accepted' } });
              //create a notification to send it to the user who send the invitation first      
              const notification = {
                user_id: senderUser._id, //user who send the invitation
                sender_id: receiverUser._id, //user who accept the invitation will send the notification
                type: 'acceptance', //type of notification
                content: `${receiverUser.userName} a accepté votre demande d'ajout.`, // the message to show in the notification
              };
              //save the notification in the db
              await Notifications.create(notification);
              const recipientSocket = io.sockets.sockets[receiver_id];

              if (recipientSocket) {
                recipientSocket.emit('acceptFriendRequest', {senderUser,receiverUser,notification});
              }          
              //send the notification to the user who send the invitation to tell him that his invitation was accepted
              res.status(201).json({ message: "Demande d'ami acceptée avec succès" });
            } else { // case of ignored invitation
              await FriendRequests.updateOne({ _id: friendRequest._id }, { $set: { status: 'ignored' } });
              res.status(201).json({ message: "Demande d'ajout d'ami ignorée." });
            }
            if(notificationId){
              await Notifications.findByIdAndUpdate(notificationId,{$set:{read:true}});
            }
          }else{
    res.status(200).json({ message: "La demande d'ajout a déjà été traitée.", friendRequest: friendRequest });
  }
    }else{
      res.status(400).json({message:"Utilisateur destinataire non trouvé."})
    }
} catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};
