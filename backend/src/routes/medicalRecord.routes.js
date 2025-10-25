const express = require("express");
const router = express.Router();
const {
  createMedicalRecord,
  getMedicalRecords,
  getMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
} = require("../controllers/medicalRecord.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

// All routes require authentication
router.use(authenticate);

// Create medical record (Doctor/Admin only)
router.post("/", authorize("admin", "doctor"), createMedicalRecord);

// Get records by patient_id
router.get("/patient/:patient_id", getMedicalRecords);

// Get single record
router.get("/:record_id", getMedicalRecord);

// Update record (Doctor who created it, or Admin)
router.put("/:record_id", authorize("admin", "doctor"), updateMedicalRecord);

// Delete record (Admin only)
router.delete("/:record_id", authorize("admin"), deleteMedicalRecord);

module.exports = router;
