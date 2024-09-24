
// UserDetailsSchema.js

const mongoose = require("mongoose");
const UserDetailsSchema = new mongoose.Schema(
  {
    fname: String,
    lname: String,
    email: { type: String, unique: true },
    password: String,
    userId: String,
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "taskinfo" }],
  },
  {
    collection: "UserInfo",
  }
);

mongoose.model("userinfo", UserDetailsSchema);
