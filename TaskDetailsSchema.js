// taskDetailsSchema.js
const mongoose = require("mongoose");

const TaskDetailsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "userinfo" },
    task: String,
    priority: String,
    dueDate: String,
  },
  {
    collection: "TaskDetails",
  }
);
mongoose.model("taskinfo", TaskDetailsSchema);