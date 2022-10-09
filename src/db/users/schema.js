import mongoose from "mongoose";
const { Schema, model } = mongoose;
import bcrypt from "bcrypt";
const userSchema = new Schema(
  {
    username: { type: String },
    email: { type: String, unique: true },
    password: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    status: { type: String, enum: ["active", "blocked"], default: "active" },
    coll: [{ type: Schema.Types.ObjectId, ref: "Collection" }],
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  const newUser = this;
  const plainPassword = newUser.password;
  const hashPW = await bcrypt.hash(plainPassword, 11);
  newUser.password = hashPW;
  next();
});

userSchema.methods.toJSON = function () {
  const userInfo = this;
  const userObject = userInfo.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

userSchema.statics.checkCredentials = async function (email, plainPassword) {
  const user = await this.findOne({ email });
  if (user) {
    const isMatch = await bcrypt.compare(plainPassword, user.password);
    if (isMatch) {
      return user;
    } else {
      return null;
    }
  } else {
    return null;
  }
};
export default model("User", userSchema);
