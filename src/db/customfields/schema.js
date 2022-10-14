import mongoose from "mongoose";
const { Schema, model } = mongoose;

const customFieldSchema = new Schema(
  {
    fieldNumber: { type: Number },
    fieldName: { type: String },
    fieldType: { type: String },
    fieldChecked: { type: Boolean },
    fieldDate: { type: Date },
    collections: { type: Schema.Types.ObjectId, ref: "Collection" },
  },
  { timestamps: true }
);
export default model("CustomField", customFieldSchema);
