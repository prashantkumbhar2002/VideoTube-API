import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {APIError} from "../utils/apiError.js"
import {APIResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import _ from 'lodash';

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;
    const userId = req.user?._id;

    // if(!content){
    //     throw new APIError(400, "Content for the tweet is needed")
    // }
    if (_.isEmpty(content)) {
        throw new APIError(400, "Content for the tweet is needed");
    }
    try {
        const tweet = await Tweet.create({
            content: content,
            owner: userId
        })
        
        if(_.isEmpty(tweet)){
            throw new APIError(500, "Error while creating Tweet")
        }
        const createdTweet = await Tweet.findById(tweet._id).select("content owner")
        return res
        .status(200)
        .json(
            new APIResponse(200, createdTweet, "Tweet Posted")
        )
    } catch (error) {
        throw new APIError(500, "::::: Error while creating Tweet", error)
    }
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params
    if(_.isEmpty(userId)){
        throw new APIError(400, "UserId is required")
    }
    // console.log(userId)
    // const user = await User.findById(userId);
    // console.log(user)
    try {
        const tweets = await Tweet.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "user",
                    // pipeline: [
                    //     {
                    //         $project: {
                    //             userName: 1,
                    //             fullName: 1,
                    //             avatar: 1
                    //         }
                    //     }
                    // ]
                },
            },
            // {
            //     $addFields: {
            //         owner: {
            //             $first: "$user"
            //         }
            //     }
            // },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "tweet",
                    as: "tweetLikes",
                    pipeline: [
                        {
                            $project:{
                                likedBy: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    likesCount: {
                        $size: "$tweetLikes"
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    // owner: {
                    //     userName: 1,
                    //     avatar: 1,
                    //     fullName: 1
                    // },
                    "user.userName":1,
                    likesCount: 1,
                    "tweetLikes.likedBy": 1
                }
            }
        ])
        // console.log(tweets)
        if(_.isEmpty(tweets)){
            throw new APIError(400, "No tweets Available")
        }

        return res
        .status(200)
        .json(
            new APIResponse(200, tweets, "tweets fetched successfully")
        )


    } catch (error) {
        throw new APIError(500, "Error while fetching Tweets", error)
    }
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params;
    const {content} = req.body;
    if(!content){
        throw new APIError(400, "Content is required")
    }
    if(!isValidObjectId(tweetId)){
        throw new APIError(400, "Invalid tweet id")
    }
    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new APIError(400, "Tweet not found")
    }
    if(tweet?.owner.toString() !== req.user?._id.toString()){
        throw new APIError(400, "Cannot have permissions to edit tweet as u are not owner")
    }
    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content
            }
        },
        {
            new: true
        }
    )

    if(!updatedTweet){
        throw new APIError(500, "Failed to update the tweet. Please try again")
    }
    return res
    .status(200)
    .json(
        new APIResponse(200, updatedTweet, "Tweet updated sucessfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params;
    if(!tweetId) {
        throw new APIError(400, "Invalid tweetId")
    }
    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new APIError(400, "Tweet not found")
    }

    if(tweet?.owner.toString() !== req.user?._id.toString()){
        throw new APIError(400, "Cannot delete the tweet as u are not owner")
    }

    await Tweet.findByIdAndDelete(tweetId)
    return res
    .status(200)
    .json(
        new APIResponse(200, {tweetId}, "Tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}