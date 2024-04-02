import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"

import {asyncHandler} from "../utils/asyncHandler.js"
import { APIError } from "../utils/apiError.js";
import { APIResponse } from "../utils/apiResponse.js";
import { Video } from "../models/video.model.js";


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

// const getUserPlaylists = asyncHandler(async (req, res) => {
//     const {userId} = req.params;
//     //TODO: get user playlists
//     if(!userId || !isValidObjectId(userId)){
//         throw new APIError(400, "Invalid UserId")
//     }
//     const userPlaylist = await Playlist.aggregate([
//         {
//             $match: {
//                 owner: new mongoose.Types.ObjectId(userId)
//             }
//         },
//         {
//             $lookup:{
//                 from: "videos",
//                 localField: "videos",
//                 foreignField: "_id",
//                 as: "videos"
//             }
//         },
//         {
//             $addFields: {
//                 totalVideos: {
//                     $size: "$videos"
//                 },
//                 totalViews: {
//                     $sum: "$videos.views"
//                 }
//             }
//         },
//         {
//             $project: {
//                 _id: 1,
//                 name: 1,
//                 description: 1,
//                 totalVideos: 1,
//                 totalViews: 1,
//                 updatedAt: 1
//             }
//         }
//     ])

//     if(!userPlaylist?.length){
//         throw new APIError(500, "Failed to fetch User Playlist")
//     }
    
//     return res
//     .status(200)
//     .json(
//         new APIResponse(200, userPlaylis[0], "Playlist fetched successfully")
//     )
// })

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        throw new APIError(400, "Please provide userID.");
    }
    console.log(userId);
    try {
        const userPlaylist = await Playlist.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId),
                },
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "videos",
                    foreignField: "_id",
                    as: "videos",
                },
            },
            {
                $unwind: "$videos",
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "videos._id",
                    foreignField: "video",
                    as: "videos.likes",
                },
            },
            {
                $addFields: {
                    "videos.totalLikes": { $size: "$videos.likes" },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "videos.owner",
                    foreignField: "_id",
                    as: "videos.videoOwner",
                },
            },
            {
                $addFields: {
                    "videos.videoOwner": { $arrayElemAt: ["$videos.videoOwner", 0] },
                },
            },
            {
                $match: {
                    "videos.isPublished": true,
                },
            },
            {
                $group: {
                    _id: "$_id",
                    name: { $first: "$name" },
                    description: { $first: "$description" },
                    createdAt: { $first: "$createdAt" },
                    updatedAt: { $first: "$updatedAt" },
                    totalVideos: { $sum: 1 },
                    totalPlayListLikes: { $sum: "$videos.totalLikes" },
                    videos: { $push: "$videos" },
                },
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    totalVideos: 1,
                    totalViews: 1,
                    totalPlayListLikes: 1,
                    videos: {
                        _id: 1,
                        videoFile: 1,
                        thumbnail: 1,
                        title: 1,
                        description: 1,
                        duration: 1,
                        createdAt: 1,
                        views: 1,
                        likes: {
                            $first: "$videos.totalLikes",
                        },
                        videoOwner: {
                            userName: 1,
                            email: 1,
                            fullName: 1,
                        },
                    },
                },
            },
        ]);
        console.log(userPlaylist);
        if (!userPlaylist || userPlaylist.length === 0) {
            throw new APIError(404, "User playlists not found.");
        }
        return res
            .status(200)
            .json(
                new APIResponse(200, userPlaylist, "Playlists fetched successfully.")
            );
    } 
    catch (error) {
        if (error instanceof APIError) {
            res
                .status(error.statusCode)
                .json(new APIError(error.statusCode, null, error.message));
        } else {
            res.status(500).json(new APIError(500, "Internal server error."));
        }
    }
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!playlistId || !isValidObjectId(playlistId)){
        throw new APIError(400, "Please provide Valid playlist ID")
    }
    const playList = await Playlist.findById(playlistId).populate('videos');
    if(!playList){
        throw new APIError(404, "PlayList not found")
    }
    const playlistVideos = playList.videos.filter(video => video.isPublished);

    const videoLikesPipeline = [
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $group: {
                _id: null,
                totalLikes: {
                    $sum: {
                        Ssize: "$likes"
                    }
                }
            }
        }
    ];
    const ownerPipeline = [
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "owner",
                as: "owner"
            }
        },
        {
            $project: {
                _id: 0,
                userName: "$owner.userName",
                fullName: "$owner.fullName"
            }
        }
    ];
    const [videosLikes, ownerResult] = await Promise.all([
        Playlist.aggregate(videoLikesPipeline),
        Playlist.aggregate(ownerPipeline)
    ]);
    const totalLikes = videosLikes.length > 0 ? videosLikes[0].totalLikes : 0;
    const owner = ownerResult.length > 0 ? ownerResult[0] : {};

    const totalVideos = playlistVideos.length;
    const totalViews = playlistVideos.reduce((acc, cur)=> acc + cur.views, 0);
    const playlistTotalLikes = playlistVideos.reduce((acc, cur) => acc + cur.likes.length, 0);
    return {
        _id: playList._id,
        name: playList.name,
        description: playList.description,
        createdAt: playList.createdAt,
        updatedAt: playList.updatedAt,
        totalVideos,
        totalViews,
        playlistTotalLikes,
        videos: playlistVideos.map(video => ({
            _id: video._id,
            videoFile: video.videoFile,
            thumbnail: video.thumbnail,
            title: video.title,
            description: video.description,
            duration: video.duration,
            createdAt: video.createdAt,
            views: video.views,
            likes: video.likes.length,
            videoOwner: {
                userName: video.owner.userName,
                fullName: video.owner.fullName
            }
        })),
        owner
    };
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!playlistId || !isValidObjectId(playlistId)){
        throw new APIError(400, "Invalid Playlist ID")
    }
    if(!videoId || !isValidObjectId(videoId)){
        throw new APIError(400, "Invalid Video ID")
    }
    const playList = await Playlist.findById(playlistId);
    if(!playList){
        throw new APIError(404, "Playlist not found")
    }
    const video = await Video.findById(videoId);
    if(!video){
        throw new APIError(404, "Video not found")
    }
    if(playList.owner?.toString() && video.owner.toString() !== req.user?._id.toString()){
        throw new APIError(400, "Only owner can add video to playlist")
    }
    const updatePlaylist = await Playlist.findByIdAndUpdate(
        playList?._id,
        {
            $addToSet: {
                videos: videoId,
            },
        },
        { new: true}
    );
    if(!updatePlaylist){
        throw new APIError(500, "Error while updating playlist")
    }
    return res
        .status(200)
        .json( new APIResponse(200, updatePlaylist, "Successfully added video to playlist"))
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


/* 
*
* Get user Playlist
* Optimized Query
[
  {
    $match: {
      owner: ObjectId("65edfd6eaa9800889cf708dd"),
    },
  },
  {
    $lookup: {
      from: "videos",
      localField: "videos",
      foreignField: "_id",
      as: "videos",
    },
  },
  {
    $unwind: "$videos",
  },
  {
    $lookup: {
      from: "likes",
      localField: "videos._id",
      foreignField: "video",
      as: "videos.likes",
    },
  },
  {
    $addFields: {
      "videos.totalLikes": {
        $size: "$videos.likes",
      },
    },
  },
  {
    $lookup: {
      from: "users",
      localField: "videos.owner",
      foreignField: "_id",
      as: "videos.videoOwner",
    },
  },
  {
    $addFields: {
      "videos.videoOwner": {
        $arrayElemAt: ["$videos.videoOwner", 0],
      },
    },
  },
  {
    $match: {
      "videos.isPublished": true,
    },
  },
  {
    $group: {
      _id: "$_id",
      name: { $first: "$name" },
      description: { $first: "$description" },
      createdAt: { $first: "$createdAt" },
      updatedAt: { $first: "$updatedAt" },
      totalVideos: { $sum: 1 },
      totalPlayListLikes: {
        $sum: "$videos.totalLikes",
      },
      videos: { $push: "$videos" },
    },
  },
  {
    $project: {
      _id: 1,
      name: 1,
      description: 1,
      createdAt: 1,
      updatedAt: 1,
      totalVideos: 1,
      totalViews: 1,
      totalPlayListLikes: 1,
      videos: {
        _id: 1,
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        createdAt: 1,
        views: 1,
        likes: {
          $first: "$videos.totalLikes",
        },
        videoOwner: {
          userName: 1,
          email: 1,
          fullName: 1,
        },
      },
    },
  },
] 
*/