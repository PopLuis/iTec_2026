// server/models/Project.js
import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  name: String,
  lang: String,
  content: { type: String, default: "" },
});

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  icon: {
    type: String,
    default: "⚡",
  },
  roomId: {
    type: String,
    required: true,
    unique: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    joinedAt: { type: Date, default: Date.now },
  }],
  files: [fileSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastOpenedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Project", projectSchema);