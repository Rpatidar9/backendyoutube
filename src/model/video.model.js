import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new Schema({
    videoFile: {
        type: String, //ordinary URL
        required: true
    },
    thumbnail: {
        type: String, //ordinary URL
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number, //ordinary URL
        required: true
    },
    views: {
        type: Number, //ordinary URL
        default: 0
    },
    isPublished: {
        type: Boolean, //ordinary URL
        default: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
}, {
    timestamps: true
})
videoSchema.plugin(mongooseAggregatePaginate)
export const Video = mongoose.model("Video", videoSchema)