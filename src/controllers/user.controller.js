import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/apiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { APIResponse } from "../utils/apiResponse.js";
const registerUser = asyncHandler(async (req, res) => {
    // res.status(200).json({
    //     message: "OK"
    // })

    //Get the user details
    //validation - not empty
    //check if user exists or not: for email and username
    //check the files - avatar and coverImage
    //upload them to cloudinary
    //create user obj - create entry in the DB
    //remove password and refresh token from the user
    //check for the user creation
    //return response


    const { userName, email, fullName, password } = req.body;
    console.log("🚀 ~ registerUser ~ userName, email, fullName, password:", userName, email, fullName, password);
    if([userName, email, fullName, password].some((field)=>{
        return field?.trim() === ""
    })){
       throw new APIError(400, "🚀 ~ All fields are Required!");
    }
    const existedUser = User.findOne({
        $or: "[{userName}, {email}]"
    });
    console.log("🚀 ~ ========================== existedUser:", existedUser);

    if(existedUser){
        throw new APIError(409, "🚀 ~ User with email or userName already exist.");
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    console.log("🚀 ~ ========================== req.files:", req.files);
    
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    console.log("🚀 ~ avatar Path  ~ coverImage Path:", avatarLocalPath, coverImageLocalPath)
    if(avatarLocalPath) {
        throw new APIError(400, "🚀 ~ Avatar is required.");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!avatar){
        throw new APIError(400, "🚀 ~ Avatar is required");
    }
    const user = User.create({
        fullName: avatar,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase()
    });

    const createdUser = await User.findOne(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new APIError(500, "🚀 ~ Error while registering the user.");
    }
    return res.status(201).json(
        new APIResponse(200, createdUser, "🚀 ~ User Created Successfully")
    )
})


export {registerUser};