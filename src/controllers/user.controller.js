import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { APIResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new APIError(
      500,
      "Something went wrong while generating access and refresh token."
    );
  }
};

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
  console.log(
    "🚀 ~ registerUser ~ userName, email, fullName, password:",
    userName,
    email,
    fullName,
    password
  );
  if (
    [userName, email, fullName, password].some((field) => {
      return field?.trim() === "";
    })
  ) {
    throw new APIError(400, "🚀 ~ All fields are Required!");
  }
  // const existedUser = await User.findOne({
  //   $or: "[{userName}, {email}]",
  // });
  const existedUser = await User.findOne({
    $or: [
      { userName: userName }, // Assuming 'userName' is the variable containing the value you want to match
      { email: email } // Assuming 'email' is the variable containing the value you want to match
    ]
  });
  
  // console.log("🚀 ~ ========================== existedUser:", existedUser);

  if (existedUser) {
    throw new APIError(409, "🚀 ~ User with email or userName already exist.");
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // console.log("🚀 ~ ========================== req.files:", req.files);

  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
      coverImageLocalPath = req.files.coverImage[0].path
  }
  // console.log("🚀 ~ avatar Path  ~ coverImage Path:", avatarLocalPath, coverImageLocalPath)
  if (!avatarLocalPath) {
    throw new APIError(400, "🚀 ~ Avatar is required.");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new APIError(400, "🚀 ~ Avatar is required");
  }
  
  const user = await User.create({
    fullName: fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });

  const createdUser = await User.findOne(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new APIError(500, "🚀 ~ Error while registering the user.");
  }
  return res
    .status(201)
    .json(new APIResponse(200, createdUser, "🚀 ~ User Created Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //get the userName and email and passwd
  //check the email and userName is valid or not
  //find the user
  //passwd check is valid or not
  // access token and refresh token
  //send cookies

  const { email, userName, password } = req.body;
  if (!email && !userName) {
    throw new APIError(400, "User or email is required..");
  }

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (!user) {
    throw new APIError(404, "User not found with this email or userName");
  }
  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new APIError(401, "Invalid user credentials.");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // here we have to think how to design and send the cookie to user
  // actually at this point we dont have accessToken in our user obj bcz we have user from above user declaration and we are calling the accessToken just before this line
  // So we have 2 options here :
  // 1. Update the user obj to add accessToken
  // 2. One more DB call (if it is not expensive)

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new APIResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged-in Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  console.log(req.user._id)
  await User.findByIdAndUpdate(
    req.user._id,
    {
      // $set: {
      //   refreshToken: undefined,
      // },
      $unset: {
        refreshToken: 1
      }
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new APIResponse(200, {}, "User Logged Out Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  // console.log(incomingRefreshToken);
  if (!incomingRefreshToken) {
    throw new APIError(401, "Unauthorized Request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    // console.log(user);
    if (!user) {
      throw new APIError(401, "Invalid Refresh Token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new APIError(401, "Refresh Token is expires or used.");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new APIResponse(
          200,
          {
            accessToken,
            refreshToken,
          },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new APIError(401, error?.message || "Invalid Refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new APIError(400, "Invalid Password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new APIResponse(200, {}, "Password Updated successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new APIResponse(200, req.user, "User fetched Successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new APIError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        // fullName: fullName,
        // email: email

        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new APIResponse(200, user, "Account details updated successfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarOldCloudinaryURL = req.user?.avatar;
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new APIError(400, "Avatar file is missing");
  }

  try {
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log(`"New Image updated successfully on cloudinary, avatar URL is ${avatar.url}"`)
    if (!avatar.url) {
      throw new APIError(400, "Error while uploading Avatar");
    }
    // const user = await User.findById(req.user?._id);
    // const currentAvatarPublicId = user.avatar.split('/').pop().split('.')[0];
    // if (currentAvatarPublicId) {
    //   await deleteFromCloudinary(currentAvatarPublicId);
    // }

    if (avatar.url && avatarOldCloudinaryURL) {
      try {
        const deleteAvatar = await deleteFromCloudinary(avatarOldCloudinaryURL)
        console.log("deleteAvatar ::::", deleteAvatar)
        if (!deleteAvatar) {
          throw new APIError(500, "Old Avator image failed to delete from cloudinary")
        }
      }
      catch (error) {
        throw new APIError(501, "Old Avator image failed to delete from cloudinary error : ", error)
      }
    }
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          avatar: avatar.url,
        },
      },
      { new: true }
    ).select("-password");
    return res
      .status(200)
      .json(new APIResponse(200, user, "Avatar image is updated successfully"));
  } catch (error) {
    throw new APIError(500, "Error while Updating avatar from Cloudinary");
  }
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const oldCoverImageUrl = req.user?.coverImage;
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new APIError(400, "Cover Image file is missing");
  }

  try {
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage) {
      throw new APIError(400, "Error while uploading Cover Image");
    }
    if(coverImage.url && oldCoverImageUrl){
      try {
        const deleteCoverImage = await deleteFromCloudinary(oldCoverImageUrl)
        if(!deleteCoverImage){
          throw new APIError(500, "Failed to delete Old Cover Image from Cloudinary")
        }
      } 
      catch (error) {
        throw new APIError(500, "Failed to delete Old Cover Image from cloudinary")
      }
    }
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          coverImage: coverImage.url,
        },
      },
      { new: true }
    ).select("-password");
  
    return res
      .status(200)
      .json(new APIResponse(200, user, "Cover Image is updated successfully"));
  } catch (error) {
    throw new APIError(500, "Error while updating cover Image in cloudinary")
  }
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;
  if (!userName) {
    throw new APIError(400, "UserName is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        userName: userName?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        subscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        subscribersCount: 1,
        subscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new APIError(404, "Channel does not exist");
  }

  return res
    .status(200)
    .json(
      new APIResponse(200, channel[0], "User channel fetched successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    userName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    }
  ]);
  // console.log(user[0].watchHistory)
  return res
    .status(200)
    .json(new APIResponse(200, user[0].watchHistory, "Watch history fetched"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
