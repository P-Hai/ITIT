const express = require("express");
const router = express.Router();
const { login, getProfile, logout } = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authLimiter } = require("../middleware/rateLimit.middleware");

// Public routes
router.post("/login", authLimiter, login);

// Protected routes
router.get("/profile", authenticate, getProfile);
router.post("/logout", authenticate, logout);

module.exports = router;
