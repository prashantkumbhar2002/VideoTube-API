import mongoose from "mongoose";

import { DB_Name } from "../constants.js";

const connectDB = async() => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.mongoUri}/${DB_Name}`)
        console.log(`\nMongodb connected!! \nDB host: ${connectionInstance.connection.host}`)
        //console.log(`\nconnectionInstance: ${connectionInstance}`)
    }
    catch(err){
        console.log("Error while connecting to mongoDB: ",err);
        process.exit(1);
    }
}

export default connectDB;