import mongoose, {isValidObjectId} from "mongoose"
import { Like } from "../models/like.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { APIError } from "../utils/apiError.js"
import { APIResponse } from "../utils/apiResponse.js"
import { Video } from "../models/video.model.js"
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
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}