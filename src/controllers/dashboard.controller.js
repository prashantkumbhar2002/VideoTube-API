import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { APIError } from "../utils/apiError.js"
import { APIResponse } from "../utils/apiResponse.js"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const stats = await User.aggregate([
        [
            {
              $match: {
                _id : new mongoose.Types.ObjectId(req.user?._id)
              }
            },
            {
              $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videos",
                pipeline: [
                  {
                    $lookup: {
                      from: "likes",
                      localField: "_id",
                      foreignField: "video",
                      as: "likes"
                    }
                  },
                  {
                    $addFields: {
                      likesCount: {
                        $size: "$likes"
                      }
                    }
                  }
                ]
              }
            },
            {
              $unwind: {
                path: "$videos",
              }
            },
            
            {
              $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
              }
            },
            {
              $addFields: {
                likes: {
                  $size:"$videos.likes"
                },
                views: "$videos.views",
                subscribers: {
                  $size: "$subscribers"
                },
              }
            },
            {
              $group: {
                _id: "owner",
                totalVideos: {
                  $sum: 1
                },
                subscribers: {
                  $first: "$subscribers"
                },
                totalViews: {
                  $sum: "$views"
                },
                totalLikes:{
                  $sum: "$likes"
                },
                videos: {
                  $push: "$videos",
                }
              }
            },
            {
              $project: {
                _id: 0,
                totalVideos: 1,
                      subscribers: 1,
                      totalViews: 1,
                      totalLikes: 1,
                videos: {
                  videoFile: 1,
                  thumbnail: 1,
                  views: 1,
                  duration: 1,
                  likesCount: 1
                }
              }
            }
        ]
    ])
    if(!stats){
        throw new APIError(500, "Error while fetching Stats")
    }
    return res
        .status(200)
        .json(new APIResponse(200, stats[0], "Successfully fetched Stats"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id),
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
            },
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            userName: 1,
                            fullName: 1,
                            avatar: 1,
                            email: 1,
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
                likesCount: {
                    $size: "$likes",
                },
                createdAt: {
                    $dateToParts: { date: "$createdAt" },
                },
                isLiked: {
                    $cond: {
                        if: {
                            $in: [new mongoose.Types.ObjectId(req.user?._id), "$likes.likedBy"],
                        },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                likes: 0,
                __v: 0,
            },
        },
    ]);
    if(!videos){
        throw new APIError(500, "Error while fetching videos")
    }
    return res
        .status(200)
        .json(new APIResponse(200, videos, "Successfully fetched Videos"))
})

export {
    getChannelStats,
    getChannelVideos
}