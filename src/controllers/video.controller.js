import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { APIError } from "../utils/apiError.js";
import { APIResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";


const getAllVideos = asyncHandler(async(req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO :: get all videos based on query, sort, pagination 
    
    
    /* for using Full Text based search u need to create a search index in mongoDB atlas
    you can include field mapppings in search index eg.title, description, as well
    Field mappings specify which fields within your documents should be indexed for text search.
    this helps in seraching only in title, desc providing faster search results
    here the name of search index is 'search-videos' */


    if (!query || !userId) {
        throw new APIError(400, "Missing required query parameters.");
    }
    if (!isValidObjectId(userId)) {
        throw new APIError(400, "Invalid userId");
    }
    // const pipeline = []
    // pipeline.push({
    //     $search: {
    //         index: "searchVideos",
    //         text: {
    //             query: query,
    //             path: ["title","description"]
    //         }
    //     },
    // });
    // pipeline.push({
    //     $match: {
    //         owner: mongoose.Types.ObjectId(userId)
    //     }
    // })
    // pipeline.push({
    //     $match: {
    //         isPublished: true
    //     }
    // })
    // //sortBy can be views, createdAt, duration
    // //sortType can be ascending(1) or descending(-1)
    // if(sortBy && sortType){
    //     pipeline.push({
    //         $sort: {
    //             [sortBy]: sortType ==="asc" ? 1 : -1
    //         }
    //     })
    // }
    // else{
    //     pipeline.push({
    //         $sort: {
    //             createdAt: -1
    //         }
    //     })
    // }
    // pipeline.push(
    //     {
    //         $lookup: {
    //             from: "users",
    //             localField: "owner",
    //             foreignField: "_id",
    //             as: "owner",
    //             pipeline:[
    //                 {
    //                     $project: {
    //                         userName: 1,
    //                         avatar: 1
    //                     }
    //                 }
    //             ]
    //         }
    //     },
    //     {
    //         $addFields:{
    //             owner: {
    //                 $first: "$owner"
    //             }
    //         }
    //     }
    // )

    const pipeline = [
        {
            $search: {
                index: "searchVideos",
                text: {
                    query: query,
                    path: ["title","description"]
                }
            },
        },
        {
            $match: {
                owner: mongoose.Types.ObjectId(userId)
            }
        },
        {
            $match: {
                isPublished: true
            }
        },
        {
            //sortBy can be views, createdAt, duration
            //sortType can be ascending(1) or descending(-1)
            $sort: {
                [sortBy || "createdAt"]: sortType === "asc" ? 1 : -1 // Default to createdAt if sortBy is not provided
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline:[
                    {
                        $project: {
                            userName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                owner: {
                    $first: "$owner"
                }
            }
        }
    ]
    try {
        const videosAggregate = await Video.aggregate(pipeline);
        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10)
        }
        const videos = await Video.aggregatePaginate(videosAggregate, options);
        return res.status(200)
        .json(new APIResponse(200, videos, "Videos Fetched successfully"))
    } catch (error) {
        throw new APIError(500, "Error while fetching videos", error)
    }
})


const publishVideo = asyncHandler(async(req, res) => {
    const { title, description } = req.params
    //TODO :: get video and upload to cloudinary and create video

     /*
       Step1: First we have to take title and description and check it.
       Step2: Get the videoFile and thumbnail from middleware.
       Step3: Fetch the local path of videoFile and thumbnail, then update it on cloudinary.
       Step4: Create the mongoDB document for the new video.
    */

   try {
        if(!title && !description){
            throw new APIError(400, "Tile or Description is required")
        }
        const userId = req?.user._id
    
        const videoPath = req?.files.VideoFile[0].path;
        const thumbnailPath = req?.files.thumbnail[0].path;
    
        if(!videoPath){
            throw new APIError(400, "Video File is required")
        }
        if(!thumbnailPath){
            throw new APIError(400, "Thumbnail is required")
        }
    
        const videoPathCloudinary = await uploadOnCloudinary(videoPath);
        const thumbnailPathCloudinary = await uploadOnCloudinary(thumbnailPath);
    
        if(!videoPathCloudinary){
            throw new APIError(400, "Error while uploading video file to cloudinary")
        }
        if(!thumbnailPathCloudinary){
            throw new APIError(400, "Error while uploading thumbnail to cloudinary")
        }
    
        if(videoPathCloudinary && thumbnailPathCloudinary){
            let video = await Video.create({
                videoFile: videoPathCloudinary.secure_url,
                thumbnail:thumbnailPathCloudinary.secure_url,
                title: title,
                description: description,
                duration: videoPathCloudinary.duration,
                views: 0,
                owner: userId
            })
    
            if(!video){
                await deleteFromCloudinary(videoPathCloudinary)
                await deleteFromCloudinary(thumbnailPathCloudinary)
                throw new APIError(500, "Error while saving video details in DB")
            }
        
            return res.status(200)
            .json(new APIResponse(
                200,
                video,
                "Video uploaded Successfully"
            ))
        }
    } 
    catch (error) {
            throw new APIError(500, "Error while uploading video.", error)
    }
})

const getVideoById = asyncHandler(async(req, res) => {
    const { videoId } = req.params
    //TODO :: get Video by ID
    
})

const updateVideo = asyncHandler(async(req, res) => {
    const { videoId } = req.params
    //TODO :: update video details like title, description, thumbnail
})

const deleteVideo = asyncHandler(async(req, res) => {
    const { videoId } = req.params
    //TODO :: delete Video
})

const togglePublishStatus = asyncHandler((req, res) => {
    const { videoId } = req.params
})


export {
    getAllVideos, 
    publishVideo,
    getVideoById,
    updateVideo, 
    deleteVideo,
    togglePublishStatus
}