import mongoose from "mongoose";
import { stringify } from "uuid";

const emailVerficationSchema = new mongoose.Schema(
    {
        userId: String,
        token: String,
        createdAt: Date,
        expiresAt: Date

    }
)

const Verification = mongoose.model("Verification",emailVerficationSchema);

export default Verification;