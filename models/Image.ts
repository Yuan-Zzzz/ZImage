import mongoose, { Schema, model, models } from "mongoose";

export interface IImage {
  hash: string;
  ext: string;
  mime: string;
  size: number;
  width: number;
  height: number;
  originalName: string;
  storedPath: string;
  thumbPath: string;
  createdAt: Date;
  updatedAt: Date;
}

const ImageSchema = new Schema<IImage>(
  {
    hash: { type: String, required: true, unique: true, index: true },
    ext: { type: String, required: true },
    mime: { type: String, required: true },
    size: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    originalName: { type: String, default: "" },
    storedPath: { type: String, required: true },
    thumbPath: { type: String, required: true },
  },
  { timestamps: true }
);

ImageSchema.index({ createdAt: -1 });

const Image = models.Image || model<IImage>("Image", ImageSchema);

export default Image as mongoose.Model<IImage>;
