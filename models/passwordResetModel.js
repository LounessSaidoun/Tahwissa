import mongoose, { mongo } from "mongoose";
import { stringify } from "uuid";

const passwordResetSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            unique: true
        }, 
        email:{
            type: String,
            unique: true
        },
        createdAt:Date,
        expirseAt: Date,
        token: String


    }
);

const PasswordReset = mongoose.model("PasswordReset",passwordResetSchema);

export default PasswordReset;