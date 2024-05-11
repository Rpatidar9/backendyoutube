import { Router } from "express";
import { registerUser, userLogin, logoutUser, generateRefreshToken, changeCurrentPassword, updateDetailOfUser, updateAvaterImage, getUserProfileDetail, getWatchHistory } from "../controller/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
const router = Router()
router.route("/register").post(upload.fields([{
    name: "avatar",
    maxCount: 1
},
{
    name: "coverImage",
    maxCount: 1
}]), registerUser)

router.route("/login").post(userLogin)

router.route("/logout").post(verifyJWT, logoutUser)

router.route("/Refresh-token").post(generateRefreshToken)

router.route("/change-password").patch(verifyJWT, changeCurrentPassword)

router.route("/update-user").patch(verifyJWT, updateDetailOfUser)

router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateAvaterImage)

router.route("/detail-user/:username").get(verifyJWT, getUserProfileDetail)

router.route("/watch-history").post(verifyJWT, getWatchHistory)
export default router