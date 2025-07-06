const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  chatRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatRoom",
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  content: { type: String, default: "" },
  type: { type: String, default: "text" }, // text, image, file, etc.
  mediaUrl: { type: String }, // For images, files, etc. (optional)
  seenBy: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);