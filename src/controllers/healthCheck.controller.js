import { APIError } from "../utils/apiError.js";
import { APIResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const healthCheck = asyncHandler(async(req, res)=> {
    return res
        .status(200)
        .json(new APIResponse(200, {message: "Everything is OK"}, "OK"))
})

export { healthCheck }