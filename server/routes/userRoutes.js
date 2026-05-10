const express = require("express");
const {
  getProfile,
  updateProfile,
  listUsers,
  connectUser,
  addOrUpdateReview,
  getReviewsForUser,
  getMatches,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.get("/matches", protect, getMatches);
router.post("/connect/:userId", protect, connectUser);
router.get("/:userId/reviews", protect, getReviewsForUser);
router.post("/:userId/reviews", protect, addOrUpdateReview);
router.get("/", protect, listUsers);

module.exports = router;
