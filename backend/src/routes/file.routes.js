const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  uploadFile,
  downloadFile,
  getFileInfo,
  deleteFile,
} = require("../controllers/file.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { uploadLimiter } = require("../middleware/rateLimit.middleware");

// Multer config (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// All routes require authentication
router.use(authenticate);

// Upload file (Medical staff only)
router.post(
  "/upload",
  authorize("admin", "doctor", "nurse"),
  uploadLimiter,
  upload.single("file"),
  uploadFile
);

// Download file
router.get("/:file_id/download", downloadFile);

// Get file info
router.get("/:file_id", getFileInfo);

// Delete file (Admin only)
router.delete("/:file_id", authorize("admin"), deleteFile);

module.exports = router;
