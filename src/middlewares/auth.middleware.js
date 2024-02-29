import { User } from "../models/user.model.js";
import { APIError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
        if(!accessToken){
            throw new APIError(401, "Unauthorized Request");
        }
        const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        const user = User.findById(decodedToken?._id).select("-password -refreshToken");
        if(!user){
            throw new APIError(401, "Invalid Access Token")
        }
        req.user = user;
        next();
    } catch (error) {
        throw new APIError(401, error?.message || "Invalid Access Token");
    }
})