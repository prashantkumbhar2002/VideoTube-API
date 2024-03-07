import { Video } from "../models/video.model";
import { APIError } from "../utils/apiError";
import { APIResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary";





const getAllVideos = asyncHandler(async(req, res) => {
    const { page = 1, limit = 10, query, sortBy, userId } = req.query
    //TODO :: get all videos based on query, sort, pagination 


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