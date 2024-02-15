// require('dotenv').config({path: './env'});
import dotenv from "dotenv";
import app from './app.js'
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000,() => {
        console.log(`Server is up and running on the port ${process.env.PORT}`);
    });
})
.catch((err)=>{
    console.log("DB Connection FAILED ",err);
})






/*
import mongoose from "mongoose";
import express from 'express';
import { DB_Name } from "./constants.js";
const app = express()

//while working with db always keep in mind that db is in remote so always try to use async/await and use the try catch
//while using the IIFE usage of the semicolon before it is recommended
;(async() => {
    try{
        await mongoose.connect(`${process.env.mongoUri}/${DB_Name}`);
        app.on("error",(error)=>{
            console.log('Error while listening to the db')
            throw error
        })

        app.listen(process.env.PORT, ()=>{
            console.log(`App is listening on the port ${process.env.PORT}`)
        })
    }catch(error){
        console.log(error);
        throw error
    }
})()                  
*/