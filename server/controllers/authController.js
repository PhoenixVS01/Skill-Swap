const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

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

const signup = async (req, res, next) => {
  try {
    const { name, email, password, bio, skillsOffered, skillsWanted } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error("Name, email, and password are required");
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(400);
      throw new Error("User already exists with this email");
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      bio: bio ? String(bio).trim() : "",
      skillsOffered: Array.isArray(skillsOffered) ? skillsOffered : [],
      skillsWanted: Array.isArray(skillsWanted) ? skillsWanted : [],
    });

    res.status(201).json({
      message: "Signup successful",
      token: generateToken(user._id),
      user: buildUserPayload(user),
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error("Email and password are required");
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    res.status(200).json({
      message: "Login successful",
      token: generateToken(user._id),
      user: buildUserPayload(user),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login };
