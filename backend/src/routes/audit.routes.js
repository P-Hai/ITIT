const express = require("express");
const router = express.Router();
const { getAuditLogs } = require("../controllers/audit.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

// All routes require Admin or Auditor role
router.use(authenticate);
router.use(authorize("admin", "auditor"));

// Get audit logs with filters
router.get("/", getAuditLogs);

module.exports = router;
