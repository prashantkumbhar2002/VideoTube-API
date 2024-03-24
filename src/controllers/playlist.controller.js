import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"

import {asyncHandler} from "../utils/asyncHandler.js"
import { APIError } from "../utils/apiError.js";
import { APIResponse } from "../utils/apiResponse.js";


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body;

    //TODO: create playlist
    if(!name){
        throw new APIError(400, "Name is required")
    }

    try {
        const playlist = await Playlist.create({
            name: name,
            description: description || "",
            owner: req.user?._id
        })
    
        if(!playlist){
            throw new APIError(500, "Failed to create Playlist")
        }
    
        return res
        .status(200)
        .json(
            new APIResponse(200, playlist, "Playlist created Successfully")
        )
    } catch (error) {
        throw new APIError(500, "Failed to create playlist")
    }
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params;
    //TODO: get user playlists
    if(!userId || !isValidObjectId(userId)){
        throw new APIError(400, "Invalid UserId")
    }
    const userPlaylist = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                }
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                totalVideos: 1,
                totalViews: 1,
                updatedAt: 1
            }
        }
    ])

    if(!userPlaylist?.length){
        throw new APIError(500, "Failed to fetch User Playlist")
    }
    
    return res
    .status(200)
    .json(
        new APIResponse(200, userPlaylis[0], "Playlist fetched successfully")
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}