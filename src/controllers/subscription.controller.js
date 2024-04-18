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
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
