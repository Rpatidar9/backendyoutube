import { asyncHandler } from "../utills/asyncHandler.js";
const registerUser = asyncHandler(async function (req, res) {
    return res.status(200).json({ message: "ok" });
})
export { registerUser }