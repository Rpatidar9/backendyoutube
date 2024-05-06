import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, fill, cb) {
        cb(null, "./public/temp")
    }, filename: function (req, fill, cb) {
        cb(null, fill.originalname)
    }
})
export const upload = multer(storage);