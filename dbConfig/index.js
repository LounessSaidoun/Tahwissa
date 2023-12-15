import mongoose from "mongoose";

const dbConnection = async () => {
    try {
        const connection = await mongoose.connect(process.env.MONGODB_URL);

        console.log('DB Connected Successfully');

        // Return the Mongoose connection object for reuse if needed
        return connection;
    } catch (error) {
        console.error('DB Error: ' + error);
        throw error;
    }
};

export default dbConnection;
