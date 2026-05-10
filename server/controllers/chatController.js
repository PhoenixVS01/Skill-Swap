const mongoose = require("mongoose");
const Message = require("../models/Message");
const User = require("../models/User");

const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, message } = req.body;

    if (!receiverId || !message) {
      res.status(400);
      throw new Error("receiverId and message are required");
    }

    const trimmedMessage = String(message).trim();
    if (!trimmedMessage) {
      res.status(400);
      throw new Error("Message cannot be empty");
    }

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      res.status(400);
      throw new Error("Invalid receiver ID");
    }

    if (receiverId === String(req.user._id)) {
      res.status(400);
      throw new Error("You cannot message yourself");
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      res.status(404);
      throw new Error("Receiver not found");
    }

    const newMessage = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      message: trimmedMessage,
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("sender", "name email")
      .populate("receiver", "name email");

    res.status(201).json({
      message: "Message sent",
      chat: populatedMessage,
    });
  } catch (error) {
    next(error);
  }
};

const getConversation = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400);
      throw new Error("Invalid user ID");
    }

    const chatPartner = await User.findById(userId).select(
      "name email averageRating ratingCount connections"
    );
    if (!chatPartner) {
      res.status(404);
      throw new Error("Chat user not found");
    }

    const currentUser = await User.findById(req.user._id).select("connections");
    const isConnected = (currentUser?.connections || []).some((connectionId) =>
      connectionId.equals(chatPartner._id)
    );

    const conversation = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id },
      ],
    })
      .sort({ timestamp: 1 })
      .populate("sender", "name email")
      .populate("receiver", "name email");

    res.status(200).json({
      messages: conversation,
      withUser: {
        id: chatPartner._id,
        name: chatPartner.name,
        email: chatPartner.email,
        averageRating: chatPartner.averageRating || 0,
        ratingCount: chatPartner.ratingCount || 0,
        isConnected,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendMessage, getConversation };
