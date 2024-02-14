import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        username:{
            type: String,
            required: true,
            unique: true,
            lowercase: true
        },
        password: {
            type: String,
            required: true
        }
    },
    {timestamps:true}
);

export const User = monggose.model('User',userSchema);