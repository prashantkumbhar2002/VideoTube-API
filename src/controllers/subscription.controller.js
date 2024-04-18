import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/apiError.js";
import { APIResponse } from "../utils/apiResponse.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    // TODO: toggle subscription
    if(!channelId || !isValidObjectId(channelId)){
        throw new APIError(400, "Provide Valid Channel ID")
    }
    const channel = await User.findById(channelId);
    if(!channel){
        throw new APIError(404, "Channel not found")
    }
    const isAlreadySubscribed = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user?._id
    })
    if(isAlreadySubscribed){
        await Subscription.findByIdAndDelete(isAlreadySubscribed?._id)
        return res
            .status(200)
            .json(new APIResponse(200, {subscribed: false}, "Unsubscribed Successfully"))
    }
    await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId
    })
    return res
        .status(200)
        .json(new APIResponse(200, {subscribed: true}, "Subscribed Successfully"))
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if(!channelId || !isValidObjectId(channelId)){
        throw new APIError(400, "Provide Valid ChannelID");
    }
    // if(channelId !== req.user?._id){
    //     throw new APIError(403, "Only Owner can Access this info")
    // }
    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribedToSubscriber"
                        },
                    },
                    {
                        $addFields: {
                            subscribedToSubscriber: {
                                $cond: {
                                    if: {
                                        $in: [new mongoose.Types.ObjectId(channelId), "$subscribedToSubscriber.subscriber"]
                                    },
                                    then: true,
                                    else: false,
                                },
                            },
                            subscribersCount: {
                                $size: "$subscribedToSubscriber"
                            }
                        },
                    }
                ]
            }
        },
        {
            $unwind: "$subscriber",
        },
        // {
        //     $project: {
        //         _id: 0,
        //         subscriber: {
        //             _id: 1,
        //             userName: 1,
        //             fullName: 1,
        //             avatar: 1,
        //             subscribersCount: 1,
        //             subscribedToSubscriber: 1
        //         }
        //     }
        // }
        {
            $group: {
                _id: null,
                totalSubscribers: { $sum: 1 },
                subscribers: { $push: "$subscriber" }
            }
        },
        {
            $project: {
                _id: 0,
                totalSubscribers: 1,
                subscribers: {
                    _id: 1,
                    fullName: 1,
                    userName: 1,
                    avatar: 1,
                    subscribersCount: 1,
                    subscribedToSubscriber: 1
                }
            }
        }
    ])
    if(!subscribers){
        throw new APIError(500, "Error while fetching Subscribers")
    }
    // console.log(JSON.stringify(subscribers))
    return res
        .status(200)
        .json(new APIResponse(200, subscribers[0], "Subscribers Fetched Successfully" ))
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    if(!subscriberId || !isValidObjectId(subscriberId)){
        throw new APIError(400, "Provide valid UserID")
    }
    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannels",
                pipeline: [
                    {
                        $lookup: {
                            from: "videos",
                            localField: "_id",
                            foreignField: "owner",
                            as: "videos"
                        }
                    },
                    {
                        $addFields: {
                            totalVideos: {
                                $size: "$videos"
                            }
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$subscribedChannels"
        },
        {
            $group: {
              _id: null,
              subscribedChannels:{
                $push: "$subscribedChannels"
              }
            }
        },
        {
            $project: {
                _id: 0,
                subscribedChannels: {
                    _id: 1,
                    fullName: 1,
                    userName: 1,
                    avatar: 1,
                    totalVideos: 1
                }
            }
        }
    ])

    if(!subscribedChannels){
        throw new APIError(500, "Error while fetching the Subscribed channels")
    }
    return res
        .status(200)
        .json(new APIResponse(200, subscribedChannels[0], "Subscribed-Channels fetched successfully"))
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
