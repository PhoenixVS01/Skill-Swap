const mongoose = require("mongoose");
const Message = require("../models/Message");
const Review = require("../models/Review");
const User = require("../models/User");

const normalizeSkills = (skills = []) =>
  skills
    .map((skill) => String(skill).trim().toLowerCase())
    .filter(Boolean);

const overlapCount = (listA = [], listB = []) => {
  const setB = new Set(listB);
  return listA.filter((item) => setB.has(item)).length;
};

const buildUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  bio: user.bio,
  skillsOffered: user.skillsOffered,
  skillsWanted: user.skillsWanted,
  averageRating: user.averageRating || 0,
  ratingCount: user.ratingCount || 0,
  connections: user.connections || [],
  createdAt: user.createdAt,
});

const refreshUserRatingStats = async (userId) => {
  const [stats] = await Review.aggregate([
    {
      $match: {
        reviewee: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $group: {
        _id: "$reviewee",
        averageRating: { $avg: "$rating" },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  const averageRating = stats?.averageRating ? Number(stats.averageRating.toFixed(2)) : 0;
  const ratingCount = stats?.ratingCount || 0;

  await User.findByIdAndUpdate(userId, { averageRating, ratingCount });

  return { averageRating, ratingCount };
};

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    res.status(200).json({
      user,
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, skillsOffered, skillsWanted } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    user.name = typeof name === "string" ? name.trim() : user.name;
    user.bio = typeof bio === "string" ? bio.trim() : user.bio;

    if (Array.isArray(skillsOffered)) {
      user.skillsOffered = skillsOffered;
    }

    if (Array.isArray(skillsWanted)) {
      user.skillsWanted = skillsWanted;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: buildUserPayload(updatedUser),
    });
  } catch (error) {
    next(error);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id).select("connections");
    const users = await User.find({ _id: { $ne: req.user._id } }).select("-password");
    const connectedIds = new Set((currentUser?.connections || []).map((id) => String(id)));

    const decoratedUsers = users.map((user) => ({
      ...user.toObject(),
      isConnected: connectedIds.has(String(user._id)),
    }));

    res.status(200).json({
      users: decoratedUsers,
    });
  } catch (error) {
    next(error);
  }
};

const connectUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400);
      throw new Error("Invalid user ID");
    }

    if (String(req.user._id) === userId) {
      res.status(400);
      throw new Error("You cannot connect with yourself");
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      res.status(404);
      throw new Error("User not found");
    }

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { connections: targetUser._id },
    });

    await User.findByIdAndUpdate(targetUser._id, {
      $addToSet: { connections: req.user._id },
    });

    res.status(200).json({
      message: `You are now connected with ${targetUser.name}`,
      connectedUser: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

const addOrUpdateReview = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400);
      throw new Error("Invalid user ID");
    }

    if (String(req.user._id) === userId) {
      res.status(400);
      throw new Error("You cannot review yourself");
    }

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      res.status(400);
      throw new Error("Rating must be between 1 and 5");
    }

    const reviewee = await User.findById(userId);
    if (!reviewee) {
      res.status(404);
      throw new Error("User not found");
    }

    const reviewer = await User.findById(req.user._id).select("connections");
    const isConnected = (reviewer?.connections || []).some((connectionId) =>
      connectionId.equals(reviewee._id)
    );

    const chatCount = await Message.countDocuments({
      $or: [
        { sender: req.user._id, receiver: reviewee._id },
        { sender: reviewee._id, receiver: req.user._id },
      ],
    });

    if (!isConnected && chatCount === 0) {
      res.status(403);
      throw new Error("You can review only users you connected/chatted with");
    }

    const review = await Review.findOneAndUpdate(
      { reviewer: req.user._id, reviewee: reviewee._id },
      {
        rating: numericRating,
        comment: typeof comment === "string" ? comment.trim() : "",
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    ).populate("reviewer", "name email");

    const ratingStats = await refreshUserRatingStats(reviewee._id);

    res.status(200).json({
      message: "Review saved successfully",
      review,
      ratingStats,
    });
  } catch (error) {
    next(error);
  }
};

const getReviewsForUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400);
      throw new Error("Invalid user ID");
    }

    const targetUser = await User.findById(userId).select("name averageRating ratingCount");
    if (!targetUser) {
      res.status(404);
      throw new Error("User not found");
    }

    const reviews = await Review.find({ reviewee: userId })
      .sort({ createdAt: -1 })
      .populate("reviewer", "name email");

    res.status(200).json({
      user: {
        id: targetUser._id,
        name: targetUser.name,
        averageRating: targetUser.averageRating || 0,
        ratingCount: targetUser.ratingCount || 0,
      },
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

const getMatches = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id).select("-password");
    if (!currentUser) {
      res.status(404);
      throw new Error("User not found");
    }

    const candidates = await User.find({ _id: { $ne: req.user._id } }).select("-password");
    const currentConnections = new Set((currentUser.connections || []).map((id) => String(id)));

    const currentOffered = normalizeSkills(currentUser.skillsOffered);
    const currentWanted = normalizeSkills(currentUser.skillsWanted);

    const matches = candidates
      .map((candidate) => {
        const candidateOffered = normalizeSkills(candidate.skillsOffered);
        const candidateWanted = normalizeSkills(candidate.skillsWanted);

        const directInterestMatches =
          overlapCount(currentWanted, candidateOffered) +
          overlapCount(currentOffered, candidateWanted);

        const sharedInterestMatches =
          overlapCount(currentWanted, candidateWanted) +
          overlapCount(currentOffered, candidateOffered);

        const interestScore = Math.min(1, (directInterestMatches * 2 + sharedInterestMatches) / 10);

        const hasRatings = currentUser.ratingCount > 0 && candidate.ratingCount > 0;
        const ratingScore = hasRatings
          ? Math.max(0, 1 - Math.abs(currentUser.averageRating - candidate.averageRating) / 5)
          : 0.5;

        const matchScore = Number((interestScore * 0.7 + ratingScore * 0.3).toFixed(3));

        return {
          ...candidate.toObject(),
          isConnected: currentConnections.has(String(candidate._id)),
          matchScore,
          matchReason: {
            directInterestMatches,
            sharedInterestMatches,
            ratingGap: Number(Math.abs(currentUser.averageRating - candidate.averageRating).toFixed(2)),
          },
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    res.status(200).json({
      matches,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  listUsers,
  connectUser,
  addOrUpdateReview,
  getReviewsForUser,
  getMatches,
};
