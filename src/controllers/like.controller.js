import mongoose, {isValidObjectId} from "mongoose"
import { Like } from "../models/like.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { APIError } from "../utils/apiError.js"
import { APIResponse } from "../utils/apiResponse.js"
import { Video } from "../models/video.model.js"
import { Tweet } from "../models/tweet.model.js"
const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!videoId || !isValidObjectId(videoId)){
        throw new APIError(400, "videoId is required");
    }
    const video = await Video.findById(videoId);
    if(!video){
        throw new APIError(404, "Video not found");
    }
    const likedAlready = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id,
    })
    
    if(likedAlready){
        await Like.findByIdAndDelete(likedAlready?._id);
        return res
        .status(200)
        .json(new APIResponse(200, {isLiked: false}))
    }

    await Like.create({
        video: videoId,
        likedBy: req.user?._id
    })

    return res
    .status(200)
    .json(new APIResponse(200, {isLiked: true}))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!commentId || !isValidObjectId(commentId)){
        throw new APIError(400, "Invalid commentId");
    }
    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new APIError(400, "Comment not found");
    }
    const alreadyLiked = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id,
    });
    if(alreadyLiked){
        await Like.findByIdAndDelete(alreadyLiked?._id)
        return res
            .status(200)
            .json( new APIResponse(200, {isLiked: false}))
    }
    await Like.create({
        comment: commentId,
        likedBy: req.user?._id
    });
    return res
        .status(200)
        .json( new APIResponse(200, {isLiked: true}))
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!tweetId || isValidObjectId(tweetId)){
        throw new APIError(200, "Invalid tweetId")
    }
    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new APIError(400, "Tweet not found")
    }
    const alreadyLiked = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id
    });
    if(alreadyLiked){
        await Like.findByIdAndDelete(alreadyLiked?._id)
        return res
            .status(200)
            .json( new APIResponse(200, {isLiked: false}))
    }
    await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id,
    })
    return res
        .status(200)
        .json(new APIResponse(200, {isLiked: true}))
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy : new mongoose.Types.ObjectId(req.user?._id) 
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideos",
                pipeline: [
                    {
                        $pipeline: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails"
                        }
                    },
                    {
                        $unwind: "$ownerDetails"
                    }
                ]
            }
        },
        {
            $unwind: "$likedVideos",
        },
        {
            $project: {
                _id: 1,
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                views: 1,
                duration: 1,
                createdAt: 1,
                isPublished: 1,
                ownerDetails: {
                    userName: 1,
                    fullName: 1,
                    avatar: 1
                }
            }
        }
    ]);
    return res
        .status(200)
        .json(new APIResponse(200, likedVideos, "Liked videos fetched successfully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}