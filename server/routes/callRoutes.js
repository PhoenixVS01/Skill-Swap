const express = require("express");
const { sendSignal, getSignals } = require("../controllers/callController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/signal", protect, sendSignal);
router.get("/signals/:userId", protect, getSignals);

module.exports = router;
