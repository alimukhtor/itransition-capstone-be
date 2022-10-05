import mongoose from "mongoose";
const { Schema, model } = mongoose;

const collectionSchema = new Schema(
  {
    name: { type: String },
    description: { type: String },
    topic: { type: String },
    image: { type: String },
    user: [{ type: Schema.Types.ObjectId, ref: "User" }],
    item: [{ type: Schema.Types.ObjectId, ref: "Item" }],
  },
  { timestamps: true }
);

collectionSchema.index({ "$**": "text" });
export default model("Collection", collectionSchema);
