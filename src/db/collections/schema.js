import mongoose from "mongoose";
const { Schema, model } = mongoose;

const collectionSchema = new Schema(
  {
    name: { type: String },
    description: { type: String },
    topic: { type: String },
    image: { type: String },
    customFields: {
      fieldNumber: { type: Number },
      fieldMultilineText: { type: String },
      fieldType: { type: String },
      fieldChecked: { type: Boolean },
      fieldDate: { type: Date },
    },
    owner: { type: Schema.Types.ObjectId, ref: "User" },
    items: [{ type: Schema.Types.ObjectId, require: true, ref: "Item" }],
  },
  { timestamps: true }
);

collectionSchema.index({ "$**": "text" });
export default model("Collection", collectionSchema);
