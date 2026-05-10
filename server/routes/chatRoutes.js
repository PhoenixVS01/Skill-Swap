const express = require("express");
const { sendMessage, getConversation } = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/message", protect, sendMessage);
router.get("/:userId", protect, getConversation);

module.exports = router;
