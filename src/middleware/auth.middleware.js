import { ApiError } from "../utills/ApiError";
import { asyncHandler } from "../utills/asyncHandler";
import jsonwebtoken from "jsonwebtoken";
import { user } from "../model/users.model.js";
export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookie?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if (!token) {
            throw new ApiError(500, "Token is required");
        }
        const verifiedToken = jsonwebtoken.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!verifiedToken) {
            throw new ApiError(500, "Token is not valid");
        }
        const users = await user.findById(verifiedToken?._id).select("-password -refreshToken");
        if (!users) {
            throw new ApiError(500, "Token is not valid");
        }
        req.user = users;
        next()
    } catch (error) {
        throw new ApiError(404, "token is not valid")
    }
})