import { asyncHandler } from "../utills/asyncHandler.js";
import { ApiError } from "../utills/ApiError.js";
import { ApiResponse } from "../utills/ApiResponse.js";
import { user } from "../model/users.model.js";
import { uploadOnCloudinary } from "../utills/cloudinary.js";
import jsonwebtoken from "jsonwebtoken";
import { Subscription } from "../model/subscription.model.js";
import mongoose from "mongoose";
const generateRefreshTokenAndAccessToken = async (userId) => {
    try {
        const findUser = await user.findById(userId);
        if (!findUser) {
            throw new ApiError(404, 'User not found');
        }
        const accessToken = findUser.generateAccessToken();
        const refreshToken = findUser.generateRefreshToken();
        findUser.refreshToken = refreshToken;
        await findUser.save();
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, error.message);
    }
};
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
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
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
const userLogin = asyncHandler(async function (req, res) {
    const data = req.body;
    if (!(data?.email || data?.username)) {
        throw new ApiError(404, "username or email is required")
    }
    const existUser = await user.findOne({ $or: [{ email: data?.email }, { username: data?.username }] })
    if (!existUser) {
        throw new ApiError(404, "User is not exist")
    }
    const isPassword = await existUser.isPasswordCorrect(data?.password)
    if (!isPassword) {
        throw new ApiError(401, "Invalid user credentials")
    }
    const { accessToken, refreshToken } = await generateRefreshTokenAndAccessToken(existUser._id)
    const option = {
        httpOnly: true, //it is only modified at  server side AND  not modified by frantend side
        secure: true
    }
    return res.status(200).cookie("accesstoken", accessToken, option).cookie("refreshToken", refreshToken, option)
        .json(new ApiResponse(200, { accessToken, refreshToken }, "logged user successfully"))
})
const logoutUser = asyncHandler(async (req, res) => {
    await user.findByIdAndUpdate(req.user._id, { $set: { refreshToken: undefined } });
    const option = {
        httpOnly: true,
        secure: true
    }
    return res.status(200).clearCookie("accessToken", option).clearCookie("refreshToken", option).json(new ApiResponse(200, {}, "User Logout Successfully"));
})
const generateRefreshToken = asyncHandler(async function (req, res) {
    const checkRefreshToken = req.body.refreshToken;
    if (!checkRefreshToken) {
        throw new ApiError(404, "Unauthorized user")
    }
    try {
        const decodedToken = jsonwebtoken.verify(checkRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const existUser = await user.findById(decodedToken._id);
        const option = {
            httpOnly: true,
            secure: true
        }
        if (!existUser) {
            throw new ApiError(404, "User is not exist")
        }
        const { accessToken, refreshToken } = await generateRefreshTokenAndAccessToken(existUser._id)
        return res.status(200).cookie("accessToken", accessToken, option).cookie("refreshToken", refreshToken, option)
            .json(new ApiResponse(200, { accessToken, refreshToken }, "your access token is refreshed "))
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            throw new ApiError(400, 'Invalid refresh token');
        } else {
            throw err;
        }
    }
})
const changeCurrentPassword = asyncHandler(async function (req, res) {
    try {
        const data = req.body
        if (!(data?.newpassword && data?.oldpassword)) {
            throw new ApiError(500, "newpassword and old password is required")
        }
        const users = await user.findById(req.user._id)
        const isPasswordC = await users.isPasswordCorrect(data?.oldpassword)
        if (!isPasswordC) {
            throw new ApiError(402, "your password is not correct")
        }
        users.password = data?.newpassword;
        await users.save({ validateBeforeSave: false })
        return res.status(200).json(new ApiResponse(200, {}, "Your password update successfully"))

    } catch (error) {
        throw new ApiError(404, error.message)
    }
})
const updateDetailOfUser = asyncHandler(async function (req, res) {
    const data = req.body;
    if (!(data?.email && data?.username && data?.fullname)) {
        throw new ApiError(401, "every field is required")
    }
    const updatedUser = await user.findByIdAndUpdate(req.user._id, {
        $set: {
            email: data?.email,
            username: data?.username,
            fullname: data?.fullname
        }
    }, {
        new: true
    }
    ).select("-password")
    return res.status(200).json(new ApiResponse(202, { updatedUser }, "User update successfully"))
})
const updateAvaterImage = asyncHandler(async function (req, res) {
    const data = req.body
    const localPathAvater = req.file?.path
    const avaterPath = await uploadOnCloudinary(localPathAvater)
    const updateAvater = await user.findByIdAndUpdate(req.user._id, {
        $set: {
            avatar: avaterPath.url
        }
    },
        { new: true }
    ).select("-password");
    return res.status(200).json(new ApiResponse(201, { updateAvater }, "Your image update successfully update"))
})
const getUserProfileDetail = asyncHandler(async function (req, res) {
    try {
        const data = req.params?.user
        if (!data?.username) {
            throw new ApiError(404, "User is not found")
        }
        const channelDetail = await user.aggregate([
            {
                $match: {
                    username: data?.username.toLowerCase()
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedTo"
                }
            },
            {
                $addFields: {
                    subscriptionsCount: {
                        $size: "$subscribers"
                    },
                    channelSubscriptionsCount: {
                        $size: "$subscribedTo"
                    },
                    isSubscribed: {
                        $cond: {
                            if: { $in: [req.user?._id, "$subscribedTo.subscriber"] }, // Corrected field name
                            then: true,
                            else: false

                        }
                    }
                }
            },
            {
                $project: {
                    fullname: 1,
                    username: 1,
                    subscriptionsCount: 1,
                    channelSubscriptionsCount: 1,
                    isSubscribed: 1,
                    email: 1,
                    avatar: 1,
                    coverImage: 1
                }
            }
        ])
        return res.status(200).json(new ApiResponse(200, channelDetail, "success"))
    } catch (error) {
        throw new ApiError(404, "something is wrong")
    }
})
const getWatchHistory = asyncHandler(async function (req, res) {
    try {
        const users = await user.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.user._id)
                },
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "watchHistory",
                    foreignField: "owner",
                    as: "watchHistory",
                    pipeline: [{
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: {
                                $project: {
                                    fullname: 1,
                                    email: 1,
                                    avatar: 1,
                                },
                            }
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }

                    }]
                }
            },
        ])
        return res.status(200).json(new ApiResponse(200, users[0].watchHistory, "Watch history fetched successfully"))
    } catch (error) {
        throw new ApiError(500, "something is wrong")
    }
})
export { registerUser, userLogin, logoutUser, generateRefreshToken, changeCurrentPassword, updateDetailOfUser, updateAvaterImage, getUserProfileDetail, getWatchHistory }