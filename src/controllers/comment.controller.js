import mongoose, {isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.model.js"
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { APIError } from "../utils/apiError.js"
import { APIResponse } from "../utils/apiResponse.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params;
    const { content } = req.body;


    if(!(videoId && isValidObjectId(videoId))){
        throw new APIError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new APIError(400, "Video not found")
    }

    if(!content){
        throw new APIError(400, "Comment Content is required")
    }

    const user = req.user?._id;

    const comment = await Comment.create({
        content: content,
        owner: user,
        video: videoId
    })

    if(!comment){
        throw new APIError(500, "Error while creating comment. Please try again")
    }

    return res
    .status(200)
    .json(new APIResponse(200, comment, "Comment created successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
}