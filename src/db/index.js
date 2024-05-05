import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const mongooseConnection = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongDB connected !! DB host :${mongooseConnection.connection.host}`);
    } catch (error) {
        console.log("MongoDB connection is Failed", error);
        process.exit(1)
    }
}

export default connectDB;