import { asyncHandler } from "../utills/asyncHandler.js";
import { ApiError } from "../utills/ApiError.js";
import { ApiResponse } from "../utills/ApiResponse.js";
import { user } from "../model/users.model.js";
import { uploadOnCloudinary } from "../utills/cloudinary.js";
const registerUser = asyncHandler(async function (req, res) {
    const data = req.body;
    if ([data.fullname, data.email, data.username, data.password].some((field) => field?.trim() == "")) {
        throw new ApiError(400, "All field is required")
    }
    const existUser = await user.findOne({
        $or: [{ username }, { email }]
    })
    if (existUser) {
        throw new ApiError(404, "User all ready exist with this name and email")
    }
    const avatarLocalPath = req?.file?.avatar[0]?.path;
    const coverImageLocalPath = req?.file?.coverImage[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
    const createUser = await user.create({
        fullname, email, username: username.toLowerCase(), password, avatar: avatar.url, coverImage: coverImage?.url || ""
    })
    const createUsers = await user.findById(createUser._id).select("-password -refreshToken")
    if (!createUsers) {
        throw new ApiError(500, "Something is wrong")
    }
    return res.status(201).json(
        new ApiResponse(200, createUser, "User register successfully")
    )
})
export { registerUser }