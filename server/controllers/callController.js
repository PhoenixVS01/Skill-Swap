const mongoose = require("mongoose");
const CallSignal = require("../models/CallSignal");
const User = require("../models/User");

const allowedSignalTypes = new Set(["offer", "answer", "ice-candidate", "end", "reject"]);

const areConnected = (connections = [], targetUserId) =>
  connections.some((connectionId) => String(connectionId) === String(targetUserId));

const sendSignal = async (req, res, next) => {
  try {
    const { toUserId, type, payload } = req.body;

    if (!toUserId || !type) {
      res.status(400);
      throw new Error("toUserId and signal type are required");
    }

    if (!mongoose.Types.ObjectId.isValid(toUserId)) {
      res.status(400);
      throw new Error("Invalid receiver ID");
    }

    if (!allowedSignalTypes.has(type)) {
      res.status(400);
      throw new Error("Unsupported signal type");
    }

    if (String(req.user._id) === String(toUserId)) {
      res.status(400);
      throw new Error("Cannot signal yourself");
    }

    const sender = await User.findById(req.user._id).select("connections");
    const receiver = await User.findById(toUserId).select("_id");
    if (!receiver) {
      res.status(404);
      throw new Error("Receiver not found");
    }

    if (!areConnected(sender?.connections, toUserId)) {
      res.status(403);
      throw new Error("Video call is allowed only for connected users");
    }

    const signal = await CallSignal.create({
      fromUser: req.user._id,
      toUser: toUserId,
      type,
      payload: payload || {},
    });

    res.status(201).json({
      message: "Signal sent",
      signal,
    });
  } catch (error) {
    next(error);
  }
};

const getSignals = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400);
      throw new Error("Invalid user ID");
    }

    const signals = await CallSignal.find({
      toUser: req.user._id,
      fromUser: userId,
      consumed: false,
    })
      .sort({ createdAt: 1 })
      .lean();

    if (signals.length > 0) {
      await CallSignal.updateMany(
        {
          _id: { $in: signals.map((signal) => signal._id) },
        },
        {
          consumed: true,
        }
      );
    }

    res.status(200).json({
      signals,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendSignal, getSignals };
