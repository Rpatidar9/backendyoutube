import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" });
        console.log("file is uploaded", response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the local saved temporiy file  ast the upload  operation got fail
        return null;
    }
}
export { uploadOnCloudinary }