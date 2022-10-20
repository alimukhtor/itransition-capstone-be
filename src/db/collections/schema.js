import mongoose from "mongoose";
const { Schema, model } = mongoose;

const collectionSchema = new Schema(
  {
    name: { type: String },
    description: { type: String },
    topic: { type: String },
    image: { type: String },
    customFields: [{ type: Object }],
    owner: { type: Schema.Types.ObjectId, ref: "User" },
    items: [{ type: Schema.Types.ObjectId, require: true, ref: "Item" }],
  },
  { timestamps: true }
);

collectionSchema.index({ "$**": "text" });
export default model("Collection", collectionSchema);
