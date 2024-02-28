import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/apiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { APIResponse } from "../utils/apiResponse.js";

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.geneateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        user.save({validateBeforeSave: false});
        return {accessToken, refreshToken};
    } catch (error) {
        throw new APIError(500, "Something went wrong while generating access and refresh token.");
    }
}


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
    // console.log("🚀 ~ ========================== existedUser:", existedUser);

    if(existedUser){
        throw new APIError(409, "🚀 ~ User with email or userName already exist.");
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // console.log("🚀 ~ ========================== req.files:", req.files);
    
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    // console.log("🚀 ~ avatar Path  ~ coverImage Path:", avatarLocalPath, coverImageLocalPath)
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


const loginUser = asyncHandler(async (req, res)=>{
    //get the userName and email and passwd
    //check the email and userName is valid or not
    //find the user 
    //passwd check is valid or not
    // access token and refresh token 
    //send cookies


    const { email, userName, password } = req.body;
    if(!email && !userName) {
        throw new APIError(400, "User or email is required..")
    }

    const user = await User.findOne({
        $or: [{userName}, {email}]
    })
    if(!user){
        throw new APIError(404, "User not found with this email or userName");
    }
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if(!isPasswordCorrect){
        throw new APIError(401, "Invalid user credentials.");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // here we have to think how to design and send the cookie to user
    // actually at this point we dont have accessToken in our user obj bcz we have user from above user declaration and we are calling the accessToken just before this line
    // So we have 2 options here : 
    // 1. Update the user obj to add accessToken
    // 2. One more DB call (if it is not expensive)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new APIResponse(
            200,
            {
                user: loggedInUser,accessToken,refreshToken
            },
            "User logged-in Successfully"
        )
    )
})

export {registerUser, loginUser};