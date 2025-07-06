const ChatRoom = require("../../models/chat/chatRoom.model");
const Message = require("../../models/chat/message.model");
const User = require("../../models/Authentication/user.model");
const mongoose = require("mongoose");

const createOrGetPrivateRoom = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const myId = req.user._id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    if (userId === String(myId)) {
      return res.status(400).json({ error: "Cannot create chat with yourself" });
    }

    let chatRoom = await ChatRoom.findOne({
      isGroup: false,
      participants: { $all: [myId, userId], $size: 2 }
    });

    if (!chatRoom) {
      chatRoom = await ChatRoom.create({
        isGroup: false,
        participants: [myId, userId]
      });
    }

    res.json(chatRoom);
  } catch (error) {
    next(error);
  }
};

const createGroupRoom = async (req, res, next) => {
  try {
    const { groupName, participantIds, groupImage, adminIds } = req.body;
    const myId = req.user._id;

    if (!groupName || !Array.isArray(participantIds) || participantIds.length < 2) {
      return res.status(400).json({ error: "Group name and at least 2 participants required" });
    }

    if (!participantIds.includes(String(myId))) participantIds.push(myId);

    const chatRoom = await ChatRoom.create({
      isGroup: true,
      groupName,
      participants: participantIds,
      groupImage,
      admins: adminIds && adminIds.length ? adminIds : [myId]
    });

    res.status(201).json(chatRoom);
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { chatRoomId, content, type, mediaUrl } = req.body;
    const myId = req.user._id;

    if (!chatRoomId || (!content && !mediaUrl)) {
      return res.status(400).json({ error: "chatRoomId and content or mediaUrl are required" });
    }

    const chatRoom = await ChatRoom.findById(chatRoomId);
    if (!chatRoom) return res.status(404).json({ error: "Chat room not found" });

    const message = await Message.create({
      chatRoom: chatRoomId,
      sender: myId,
      content,
      type: type || (mediaUrl ? "media" : "text"),
      mediaUrl,
      seenBy: [myId]
    });

    chatRoom.lastMessage = message._id;
    await chatRoom.save();

    await message.populate("sender", "userName fullname profileImage");

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};

const getMyChatRooms = async (req, res, next) => {
  try {
    const myId = req.user._id;

    const rooms = await ChatRoom.find({ participants: myId })
      .populate("participants", "userName fullname profileImage")
      .populate("lastMessage");

    res.json(rooms);
  } catch (error) {
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const { chatRoomId } = req.params;
    const { limit = 20, skip = 0 } = req.query;

    const messages = await Message.find({ chatRoom: chatRoomId })
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .populate("sender", "userName fullname profileImage");

    res.json(messages.reverse());
  } catch (error) {
    next(error);
  }
};

const markAsSeen = async (req, res, next) => {
  try {
    const myId = req.user._id;
    const { chatRoomId } = req.body;

    await Message.updateMany(
      { chatRoom: chatRoomId, seenBy: { $ne: myId } },
      { $addToSet: { seenBy: myId } }
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Export all functions at the end
module.exports = {
  createOrGetPrivateRoom,
  createGroupRoom,
  sendMessage,
  getMyChatRooms,
  getMessages,
  markAsSeen,
};