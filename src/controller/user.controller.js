import { asyncHandler } from "../utills/asyncHandler.js";
import { ApiError } from "../utills/ApiError.js";
import { ApiResponse } from "../utills/ApiResponse.js";
import { user } from "../model/users.model.js";
import { uploadOnCloudinary } from "../utills/cloudinary.js";
const generateRefreshTokenAndAccessToke = async (userId){
    try {
        const user = await user.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "something error")
    }
}

const registerUser = asyncHandler(async function (req, res) {
    const data = req.body;

    if ([data.fullname, data.email, data.username, data.password].some((field) => field?.trim() == "")) {
        throw new ApiError(400, "All field is required")
    }

    const existUser = await user.findOne({
        $or: [{ username: data?.username }, { email: data?.email }]
    })
    if (existUser) {
        throw new ApiError(404, "User all ready exist with this name and email")
    }
    console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    console.log(avatarLocalPath, "avatarLocalPath");
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
    const createUser = await user.create({
        fullname: data?.fullname, email: data?.email, username: data?.username, password: data?.password, avatar: avatar.url, coverImage: coverImage?.url || ""
    })
    const createUsers = await user.findById(createUser._id).select("-password -refreshToken")
    if (!createUsers) {
        throw new ApiError(500, "Something is wrong")
    }
    return res.status(201).json(
        new ApiResponse(200, createUser, "User register successfully")
    )
})

const userLogin = asyncHandler(async function (pareq, res) {
    const data = req.body;
    if (!data?.email || !data?.username) {
        throw new ApiError(404, "username or email is required")
    }
    const existUser = await user.findOne({ $or: [{ email: data?.email }, { username: data?.username }] })
    if (!existUser) {
        throw new ApiError(404, "User is not exist")
    }
    const isPassword = await user.isPasswordCorrect(data?.password)
    if (!isPassword) {
        throw new ApiError(401, "Invalid user credentials")
    }
    const { accessToken, refreshToken } = await generateRefreshTokenAndAccessToke(user._id)
    const option = {
        httpOnly: true,
        secure: true
    }
    return res.status(200).cookie("accesstoken", accessToken, option).cookie("refreshToken", refreshToken, option)
        .json(new ApiResponse(200, { accessToken, refreshToken }, "logged user successfully"))
})
export { registerUser, userLogin }