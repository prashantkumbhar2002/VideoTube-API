import mongoose, { Schema }from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const userSchema = new Schema({
    userName: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true             //if we want to make any field to be searchable then add this index
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String,           //cloudinary url
        required: true
    },
    coverImage: {
        type: String,            //cloudinary url
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,
        required: [true, "Password is Required."]
    },
    refreshToken: {
        type: String
    }    
},{
    timestamps: true
});

export const User = mongoose.model("User", userSchema);