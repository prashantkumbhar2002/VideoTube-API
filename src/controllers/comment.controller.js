import mongoose, {isValidObjectId} from "mongoose"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import { APIError } from "../utils/apiError.js"
import { APIResponse } from "../utils/apiResponse.js"
import { Like } from "../models/like.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!(videoId && isValidObjectId(videoId))){
        throw new APIError(400, "VideoId not found")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new APIError(400, "Video not found")
    }

    const commentAgg = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                },
                owner: {
                    $first: "$owner"
                },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $sort:{
                createdAt: -1
            }
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                isLiked: 1,
                likesCount: 1,
        //only send essential owner information
                owner: {
                    userName: 1, 
                    fullName: 1,
                    avatar: 1
                }
            }
        }
    ]);
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }
    const comment = await Comment.aggregatePaginate(commentAgg, options)
    return res
    .status(200)
    .json(
        new APIResponse(200, comment, "Comments Fetched successfully")
    )
})

// const getVideoComments = asyncHandler(async (req, res) => {
//     const { videoId } = req.params;
//     const { page = 1, limit = 10 } = req.query;

//     if (!(videoId && isValidObjectId(videoId))) {
//         return res
//         .status(400)
//         .json(new APIError(400, "VideoId not found"));
//     }

//     const pipeline = [
//         {
//             $match: {
//                 _id: new mongoose.Types.ObjectId(videoId)
//             }
//         },
//         {
//             $lookup: {
//                 from: "comments",
//                 let: { videoId: "$_id" },
//                 pipeline: [
//                     {
//                         $match: {
//                             $expr: { $eq: ["$videoId", "$$videoId"] }
//                         }
//                     },
//                     {
//                         $lookup: {
//                             from: "users",
//                             localField: "owner",
//                             foreignField: "_id",
//                             as: "owner"
//                         }
//                     },
//                     {
//                         $lookup: {
//                             from: "likes",
//                             localField: "_id",
//                             foreignField: "comment",
//                             as: "likes"
//                         }
//                     },
//                     {
//                         $addFields: {
//                             likesCount: { $size: "$likes" },
//                             owner: { $first: "$owner" },
//                             isLiked: {
//                                 $cond: {
//                                     if: { $in: [req.user?._id, "$likes.likedBy"] },
//                                     then: true,
//                                     else: false
//                                 }
//                             }
//                         }
//                     },
//                     {
//                         $project: {
//                             content: 1,
//                             createdAt: 1,
//                             isLiked: 1,
//                             likesCount: 1,
//                             owner: {
//                                 userName: 1,
//                                 fullName: 1,
//                                 avatar: 1
//                             }
//                         }
//                     }
//                 ],
//                 as: "comments"
//             }
//         },
//         {
//             $unwind: "$comments"
//         },
//         {
//             $replaceRoot: { newRoot: "$comments" }
//         },
//         {
//             $sort: { createdAt: -1 }
//         }
//     ];

//     const options = {
//         page: parseInt(page, 10),
//         limit: parseInt(limit, 10)
//     };

//     try {
//         const result = await Comment.aggregatePaginate(Comment.aggregate(pipeline), options);
//         console.log(result)
//         return res.status(200).json(new APIResponse(200, result, "Comments fetched successfully"));
//     } catch (error) {
//         console.error("Error fetching comments:", error);
//         return res.status(500).json(new APIResponse(500, null, "Internal Server Error"));
//     }
// });


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

    if(!content || typeof content !== 'string' || content.trim() === ''){
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
    const {commentId} = req.params;
    const { content } = req.body;
    if(!commentId){
        throw new APIError(400, "comment Id is required")
    }

    if(!content){
        throw new APIError("Content is required")
    }

    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new APIError(400, "Comment not found")
    }

    if(comment?.owner.toString() !== req.user?._id.toString()){
        throw new APIError(400, "Cannot update the comment as u are not owner")
    }
    const updatedComment = await Comment.findByIdAndUpdate(
        comment?._id,
        {
            $set: {
                content
            }
        },
        { new: true }
    );

    if (!updatedComment) {
        throw new APIError(500, "Failed to edit comment please try again");
    }

    return res
        .status(200)
        .json(
            new APIResponse(200, updatedComment, "Comment edited successfully")
        );
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params;
    if(!(commentId && isValidObjectId(commentId))){
        throw new APIError(400, "commentID is invalid")
    }

    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new APIError(400, "comment not found")
    }

    if(comment.owner.toString() !== req.user?._id.toString()){
        throw new APIError(400, "Cannot delete comment as u are not owner")
    }

    const dComment = await Comment.findByIdAndDelete(commentId);
    if(!dComment){
        throw new APIError(500, "Failed to delete comment")
    }
    await Like.deleteMany(
        {
            comment: commentId,
            likedBy: req.user
        }
    )
    return res
    .status(200)
    .json(new APIResponse(200, {}, "Comment deleted successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}