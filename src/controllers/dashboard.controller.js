import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { APIError } from "../utils/apiError.js"
import { APIResponse } from "../utils/apiResponse.js"
import { User } from "../models/user.model.js"

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
})

export {
    getChannelStats,
    getChannelVideos
}