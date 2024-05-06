// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
// import express from "express";
// const app = express()
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: './env'
})
connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`server is runnning at  port ${process.env.PORT}`);
        })
    })
    .catch((error) => {
        console.log("mongoDB connection is failed");
    })















/* (async () => {
     try {

         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
         app.on("error", (error) => {
             console.log("error", error);
             throw error;
         })
         app.listen(process.env.PORT, () => {
             console.log(`app is listening at PORT ${process.env.PORT}`);
         })
     } catch (error) {
         console.log("error", error);
         throw error
     }
 })()
 */