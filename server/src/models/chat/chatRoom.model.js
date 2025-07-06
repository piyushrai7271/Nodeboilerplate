const mongoose = require("mongoose");

const chatRoomSchema = new mongoose.Schema(
  {
    isGroup: { type: Boolean, default: false },
    groupName: { type: String }, // group name, optional for 1-to-1
    groupImage: { type: String }, // group avatar (optional)
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
    admins: [
      // group admins, for group chat management (optional)
      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatRoom", chatRoomSchema);
